const net = require('net');

const pingServer=(host, port, timeout)=>{
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      //? Send the "ping" message to the server
      socket.write('ping');
    });

    socket.setTimeout(timeout);

    socket.on('data', (data) => {
      //? If we receive any data from the server, assume the server is active
      resolve(true);
    });

    socket.on('timeout', () => {
      //? If the connection times out, assume the server is not responding
      socket.destroy();
      reject(false);
    });

    socket.on('error', () => {
      //? If there is an error connecting to the server, assume it is not active
      reject(false);
    });
  });
}

module.exports = pingServer;