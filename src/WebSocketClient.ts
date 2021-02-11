// https://stackoverflow.com/questions/58432076/websockets-with-functional-components

export interface Callbacks {
  onopen: (e: Event) => void;
  onmessage: (e: MessageEvent) => void;
  onerror: (e: Event) => void;
  onclose: (e: CloseEvent) => void;
}

class WebSocketClient {
  static instance: WebSocketClient | null = null;
  callbacks: Callbacks = {
    // @TODO remove console.log
    onopen: (e: Event) => {
      console.log("WebSocket open");
    },
    onmessage: (e: MessageEvent) => {
      console.log("got message: " + e.data);
    },
    onerror: (e: Event) => {
      console.log(e);
    },
    onclose: (e: CloseEvent) => {
      console.log("WebSocket closed");
    },
  };
  socketRef: WebSocket | null = null;
  path: string = "";

  static getInstance() {
    if (!WebSocketClient.instance)
      WebSocketClient.instance = new WebSocketClient();
    return WebSocketClient.instance;
  }

  // constructor() {
  //   // this.socketRef = null;
  //   // this.connect();
  //   this.callbacks = {
  //   };
  // }

  setCallbacks = (callbacks: Callbacks) => (this.callbacks = callbacks);

  connect = (path = "ws://127.0.0.1:8005") => {
    this.path = path;
    this.socketRef = new WebSocket(path);

    this.socketRef.onopen = (e) => {
      this.callbacks.onopen(e);
    };

    this.socketRef.onmessage = (e) => {
      this.callbacks.onmessage(e);
    };

    this.socketRef.onerror = (e) => {
      this.callbacks.onerror(e);
    };

    this.socketRef.onclose = (e) => {
      this.callbacks.onclose(e);
    };
  };

  disconnect = () => {
    if (this.socketRef) this.socketRef.close();
  };

  send = (msg: string) => {
    if (this.socketRef) this.socketRef.send(msg);
  };

  state = () => this.socketRef?.readyState;

  // waitForSocketConnection = (callback: any) => {
  //   const socket = this.socketRef;
  //   const recursion = this.waitForSocketConnection;
  //   setTimeout(() => {
  //     if (socket != null && socket.readyState === 1) {
  //       console.log("Connection is made");
  //       if (callback != null) {
  //         callback();
  //       }
  //       return;
  //     } else {
  //       console.log("wait for connection...");
  //       recursion(callback);
  //     }
  //   }, 1);
  // };
}

export default WebSocketClient.getInstance();
