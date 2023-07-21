import express from "express"
import  * as f from "./fetch_methods.js"
//import zmq from "zeromq"
// OK THE FUCKING ZMQ SOURCE CODE IS SEGFAULTING IN THE CONTAINER

const THIS_HOST = "http://c-srv";
const THIS_PORT = 3000;
const THIS_URL = THIS_HOST + ":" + THIS_PORT + "/";
// const SUB = zmq.Subscriber();

console.log("hello world");
console.log(process.env.CLOUD_IP);

//const SOCK = zmq.socket("sub");
// ZMQ needs TCP, and you need to give the exact ip address, not hostname

//JUST SET AN ENV VARIABLE IN THE DOCKER COMPOSE
// getDockerHostIP((err, dockerHostIP) => {
//     if (err) {
//       console.error('Error getting Docker host IP:', err);
//       return;
//     }
  
//     // Get the IP address of the container
//     const interfaces = os.networkInterfaces();
//     const containerIP = interfaces['eth0'][0].address; // Assuming the container interface is named 'eth0'
  
//     console.log('Container IP address:', containerIP);
//     console.log('Docker host IP address:', dockerHostIP); // THIS IS SO FUCKING CRINGE DUDE
//   });


const ADDR = process.env.CLOUD_IP;
console.log(ADDR);
SOCK.connect("tcp://"+ADDR+":"+THIS_PORT);


SOCK.subscribe("test");
SOCK.on("message", 
        ([topic, message]) => {
            // Decomposition is lit, topic should always be "test"
            console.log('Recieved message from edge');
            console.log(message);
        }
    );


const app = express();
app.use(express.json());

function heartbeat() {
    const timer = 1000*15; //15s
    const endpoint = "http://e-srv:3000/sync";

    setInterval(() => {
        f.HOFetch(
            endpoint, 
            {
                method: 'GET',
                headers: {
                    "accept": "application/json",
                    "content-type": "application/json"
                }
            },
            (response) => {
                //Update database
                console.log(response);
            }
        )
        
        }, 
    timer);
}

 heartbeat();



app.post('/', (req, res)=> {
    console.log("Received POST request:")
    console.log(req.body);
    console.log("----------------------")
    res.send("Recieved POST request!");
})

app.listen(3000)
