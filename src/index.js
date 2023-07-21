import express from "express"
import  * as f from "./fetch_methods.js"
import zmq from "zeromq"

// Using version 6 (beta) ZMQ, Node version 14

const THIS_HOST = "http://c-srv";
const THIS_PORT = 3000;
const THIS_URL = THIS_HOST + ":" + THIS_PORT + "/";
// const SUB = zmq.Subscriber();

console.log("hello world");
console.log(process.env.CLOUD_IP);

const SOCK = new zmq.Subscriber
const ADDR = process.env.CLOUD_IP;
// ZMQ needs TCP, and you need to give the exact ip address, not hostname
console.log(ADDR);
SOCK.connect("tcp://"+ADDR+":"+THIS_PORT);
SOCK.subscribe("test");

// SOCK.message("message", 
//         ([topic, message]) => {
//             // Decomposition is lit, topic should always be "test"
//             console.log('Recieved message from edge');
//             console.log(message);
//         }
//     );

// SOCK.on("message", function(topic, message) {
//     console.log(
//       "received a message related to:",
//       topic,
//       "containing message:",
//       message
//     );
//   });

    for await (const [topic, msg] of SOCK) {
        console.log("received a message related to:", topic, "containing message:", msg)
    }


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
