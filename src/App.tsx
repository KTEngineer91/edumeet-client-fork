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
import { permissions } from "./utils/roles";
import { SnackbarKey, SnackbarProvider, useSnackbar } from "notistack";
import { IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { meActions } from "./store/slices/meSlice";
import InvalidUrlImage from "../public/images/invalid_url.png";
import ErrorIconImage from "../public/images/error_icon.png";
import LoadingIconImage from "../public/images/loading_icon.png";

type AppParams = {
  id: string;
};
const APP_BACKEND_URL = 'https://stream.breezeshot.com/api-server/api/v1'

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
  const roomId = searchParams.get("roomId");
  const topicId = searchParams.get("topicId");
  const userKey = searchParams.get("userKey");

  useEffect(() => {
    dispatch(startListeners());
    return () => {
      dispatch(stopListeners());
      dispatch(roomActions.setState("new"));
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${APP_BACKEND_URL}/topic-group/validate-edumeet-room?topicId=${topicId}&userKey=${userKey}&roomId=${roomId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          setErrorMessage("Provided URL is not valid" as any);
          if (customInterval) {
            clearInterval(customInterval);
          }
        } else {
          const data = await response.json();
          if (!data?.success) {
            setErrorMessage(data?.message);
          } else {
            setUserData(data?.user);
          }
        }

        setIsUserEligibleValidated(true);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    if (roomId && topicId && userKey) {
      fetchData();
    } else {
      setIsUserEligibleValidated(true);
    }
    customInterval = setInterval(() => {
      if (roomId && topicId && userKey) {
        fetchData();
      } else {
        setIsUserEligibleValidated(true);
      }
    }, 10000);

    return () => {
      if (customInterval) {
        clearInterval(customInterval);
      }
    };
  }, []);

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
      dispatch(roomActions.setState("new"));
      navigate("/");
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

  const isValidUrl = roomId && topicId && userKey;

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
