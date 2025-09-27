/* eslint-disable */
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { startListeners, stopListeners } from "./store/actions/startActions";
import {
  useAppDispatch,
  useAppSelector,
  usePermissionSelector,
} from "./store/hooks";
import StyledBackground from "./components/StyledBackground";
import Join from "./views/join/Join";
import Lobby from "./views/lobby/Lobby";
import Room from "./views/room/Room";
import { sendFiles } from "./store/actions/filesharingActions";
import { uiActions } from "./store/slices/uiSlice";
import { roomActions } from "./store/slices/roomSlice";
import { permissionsActions } from "./store/slices/permissionsSlice";
import { permissions } from "./utils/roles";
import { SnackbarKey, SnackbarProvider, useSnackbar } from "notistack";
import { IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { meActions } from "./store/slices/meSlice";
import InvalidUrlImage from "../public/images/invalid_url.png";
import ErrorIconImage from "../public/images/error_icon.png";
import LoadingIconImage from "../public/images/loading_icon.png";
import { Logger } from "./utils/Logger";

type AppParams = {
  id: string;
};
const APP_BACKEND_URL = 'http://localhost:3002/api/v1'
const logger = new Logger('App');

interface SnackbarCloseButtonProps {
  snackbarKey: SnackbarKey;
}

const SnackbarCloseButton = ({
  snackbarKey,
}: SnackbarCloseButtonProps): JSX.Element => {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton onClick={() => closeSnackbar(snackbarKey)}>
      <Close />
    </IconButton>
  );
};

let ErrorData = {
  headingText: `Error`,
  messageText: "",
  image: ErrorIconImage,
};
let InvalidData = {
  headingText: "Invalid Media Url",
  messageText: "Please use a valid meeting link from breezeshot",
  image: InvalidUrlImage,
};
let LoadingData = {
  headingText: "Loading..",
  messageText: `Please wait while we'll connect you to the server`,
  image: LoadingIconImage,
};
let customInterval: any = null;
const App = (): JSX.Element => {
  const backgroundImage = useAppSelector((state) => state.room.backgroundImage);
  const dispatch = useAppDispatch();
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState();
  const [isUserEligibleValidated, setIsUserEligibleValidated] = useState(false);
  const roomState = useAppSelector((state) => state.room.state);
  const [searchParams] = useSearchParams();
  const hasFilesharingPermission = usePermissionSelector(
    permissions.SHARE_FILE
  );
  const navigate = useNavigate();
  const roomParam = searchParams.get("room");
  const roomId = searchParams.get("roomId") || roomParam as any;
  const topicId = searchParams.get("topicId");
  const userKey = searchParams.get("userKey");
  const token = searchParams.get("token");
  const sessionKey = roomId ? `edumeet:breezeSession:${roomId}` : undefined;
  const readSession = () => {
    try {
      if (!sessionKey) return null;
      const raw = sessionStorage.getItem(sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const writeSession = (user: any) => {
    try {
      if (!sessionKey) return;
      const payload = { user, ts: Date.now() };
      sessionStorage.setItem(sessionKey, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  };
  const existingSession = readSession();

  useEffect(() => {
    dispatch(startListeners());
    return () => {
      dispatch(stopListeners());
      dispatch(roomActions.setState("new"));
    };
  }, []);

  useEffect(() => {
    const validateLegacy = async () => {
      const response = await fetch(
        `${APP_BACKEND_URL}/topic-group/validate-edumeet-room?topicId=${topicId}&userKey=${userKey}&roomId=${roomId}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        }
      );
      if (!response.ok) {
        setErrorMessage("Provided URL is not valid" as any);
        return { success: false };
      }
      const data = await response.json();
      if (!data?.success) {
        setErrorMessage(data?.message);
        return { success: false };
      }
      setUserData(data?.user);
      writeSession(data?.user);
      return { success: true };
    };
    

    const validateToken = async () => {
      const response = await fetch(`${APP_BACKEND_URL}/topic-group/validate-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token })
      });
      if (!response.ok) {
        setErrorMessage("Provided token is not valid" as any);
        return { success: false };
      }
      const data = await response.json();
      if (!data?.success) {
        setErrorMessage(data?.message);
        return { success: false };
      }
      setUserData(data?.user);
      writeSession(data?.user);
      // Remove token from the URL so a refresh doesn't revalidate an expired token
      try {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        params.delete('token');
        url.search = params.toString();
        window.history.replaceState({}, '', url.toString());
      } catch {}
      return { success: true };
    };

    const run = async () => {
      try {
        let result = { success: false } as any;
        if (token && roomId) {
          // Store token in Redux for signaling connection
          dispatch(permissionsActions.setToken(token));
          result = await validateToken();
          if (customInterval) clearInterval(customInterval);
        } else if (existingSession && roomId && !token && !topicId && !userKey) {
          // Allow same-tab refresh without revalidating a short-lived token
          setUserData(existingSession.user);
          result = { success: true } as any;
          if (customInterval) clearInterval(customInterval);
        } else if (roomId && topicId && userKey) {
          result = await validateLegacy();
        } else {
          // nothing to validate, will show invalid
        }
        setIsUserEligibleValidated(true);
        return result;
      } catch (e) {
        logger.error('Error validating: %o', e);
        setIsUserEligibleValidated(true);
        return { success: false };
      }
    };

    run();
    // Only poll for legacy URLs; token flow is one-shot to avoid later expiry errors
    if (!token && roomId && topicId && userKey) {
      customInterval = setInterval(run, 10000);
    }

    return () => {
      if (customInterval) clearInterval(customInterval);
    };
  }, [token, roomId, topicId, userKey]);

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    if (roomState !== "joined" || !hasFilesharingPermission) return;

    const droppedFiles = event.dataTransfer.files;

    if (droppedFiles?.length) {
      dispatch(uiActions.setUi({ filesharingOpen: true }));
      dispatch(sendFiles(droppedFiles));
    }
  };

  useEffect(() => {
    if (roomState === "left") {
      // Don't navigate to invalid link screen, just close the window
      window.close();
      
      // Fallback for browsers that don't allow window.close()
      if (!window.closed) {
        window.location.href = 'about:blank';
      }
    }
  }, [roomState]);

  /**
   * Detect WebGL-support.
   */
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (gl && gl instanceof WebGLRenderingContext) {
      dispatch(meActions.setWebGLSupport(true));
    }
  }, []);

  const isValidUrl = (roomId && token) || (roomId && topicId && userKey) || (roomId && !!existingSession);

  let name = (userData as any)?.username;

  const renderBreezeShotInfoContainer = ({
    image,
    headingText,
    messageText,
  }: any) => {
    return (
      <div className="breeze-shot-container">
        <img alt="Logo" src={image} className="breeze-shot-image" />
        <div className="breeze-shot-text-container">
          <h2 className="breeze-shot-heading">{headingText}</h2>
          <p className="breeze-shot-message">{messageText}</p>
        </div>
      </div>
    );
  };
  const messageData = !isUserEligibleValidated
    ? LoadingData
    : !isValidUrl
    ? InvalidData
    : errorMessage
    ? { ...ErrorData, messageText: errorMessage }
    : null;
  return (
    <SnackbarProvider
      action={(snackbarKey: SnackbarKey) => (
        <SnackbarCloseButton snackbarKey={snackbarKey} />
      )}
    >
      <StyledBackground
        onDrop={handleFileDrop}
        onDragOver={(event) => event.preventDefault()}
        backgroundimage={backgroundImage}
      >
        {messageData ? (
          renderBreezeShotInfoContainer(messageData as any)
        ) : roomState === "joined" ? (
          <Room />
        ) : roomState === "lobby" ? (
          <Lobby />
        ) : (
          roomState === "new" && <Join roomId={roomId as any} userName={name} />
        )}
      </StyledBackground>
    </SnackbarProvider>
  );
};

export default App;
