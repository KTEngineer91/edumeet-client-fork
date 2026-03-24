/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import EventEmitter from 'events';

type Callback = () => void;
type Errback = (error: unknown) => void;

export interface PeerConsumer {
	id: string;
	kind: string;
	track: MediaStreamTrack;
	appData: Record<string, unknown>;
	observer: EventEmitter;
	once(event: 'transportclose', listener: () => void): this;
	pause(): void;
	resume(): void;
	close(): void;
}

export interface PeerProducer {
	id: string;
	closed: boolean;
	appData: Record<string, unknown>;
	observer: EventEmitter;
	pause(): void;
	resume(): void;
	close(): void;
	replaceTrack(_options: { track: MediaStreamTrack | null }): Promise<void>;
}

type ConnectData = {
	dtlsParameters: unknown;
	iceParameters: unknown;
};

type ProduceData = {
	id: string;
	kind: string;
	rtpParameters: unknown;
	appData: Record<string, unknown>;
};

export interface PeerTransport {
	handler: { pc: RTCPeerConnection };
	on(_event: 'icecandidate', _listener: (candidate: unknown) => void): this;
	on(_event: 'connect', _listener: (data: ConnectData, callback: Callback, errback: Errback) => void): this;
	on(_event: 'produce', _listener: (data: ProduceData) => void): this;
	connect(_options: { dtlsParameters: unknown; iceParameters: unknown }): Promise<void>;
	addIceCandidate(_options: { candidate: unknown }): Promise<void>;
	consume(_options: {
		id: string;
		kind: string;
		rtpParameters: unknown;
		appData: Record<string, unknown>;
	}): Promise<PeerConsumer>;
	produce(_options: { track?: MediaStreamTrack | null; codec?: unknown } & Record<string, unknown>): Promise<PeerProducer>;
	close(): void;
}

class StubPeerProducer extends EventEmitter implements PeerProducer {
	public id = `stub-peer-producer-${
		Math.random()
			.toString(36)
			.slice(2)
	}`;
	public closed = false;
	public appData: Record<string, unknown> = {};
	public observer = new EventEmitter();

	public pause(): void {}

	public resume(): void {}

	public close(): void {
		this.closed = true;
		this.observer.emit('close');
	}

	public async replaceTrack(): Promise<void> {}
}

class StubPeerConsumer extends EventEmitter implements PeerConsumer {
	public id: string;
	public kind: string;
	public track: MediaStreamTrack;
	public appData: Record<string, unknown>;
	public observer = new EventEmitter();

	public constructor(id: string, kind: string, appData: Record<string, unknown>) {
		super();
		this.id = id;
		this.kind = kind;
		this.appData = appData;
		this.track = {} as MediaStreamTrack;
	}

	public close(): void {
		this.observer.emit('close');
	}

	public pause(): void {}

	public resume(): void {}
}

class StubPeerTransport extends EventEmitter implements PeerTransport {
	public handler = { pc: new RTCPeerConnection() };

	public async connect(): Promise<void> {}

	public async addIceCandidate(): Promise<void> {}

	public async consume(options: {
		id: string;
		kind: string;
		appData: Record<string, unknown>;
	}): Promise<PeerConsumer> {
		return new StubPeerConsumer(options.id, options.kind, options.appData);
	}

	public async produce(): Promise<PeerProducer> {
		return new StubPeerProducer();
	}

	public close(): void {
		this.handler.pc.close();
		this.emit('close');
	}
}

type PeerCodec = { mimeType: string };

export class PeerDevice {
	public ready = Promise.resolve();
	public rtpCapabilities: { codecs?: PeerCodec[] } = { codecs: [] };

	public async getRtpCapabilities(): Promise<{ codecs?: PeerCodec[] }> {
		return this.rtpCapabilities;
	}

	public async load(_options?: unknown): Promise<void> {}

	public createRecvTransport(_options?: unknown): PeerTransport {
		return new StubPeerTransport();
	}

	public createSendTransport(_options?: unknown): PeerTransport {
		return new StubPeerTransport();
	}
}
