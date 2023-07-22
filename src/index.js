import express from "express"
import  * as f from "./fetch_methods.js"
import zmq from "zeromq"
import dns from "dns"

// Using version 6 (beta) ZMQ, Node version 14

const THIS_HOST = "http://c-srv";
const THIS_PORT = 3000;
const THIS_URL = THIS_HOST + ":" + THIS_PORT + "/";
// const SUB = zmq.Subscriber();

const SOCK = new zmq.Subscriber

// SOCK.message("message", 
//         ([topic, message]) => {
//             // Decomposition is lit, topic should always be "test"
//             console.log('Recieved message from edge');
//             console.log(message);
//         }
//     );

const containerName = 'c-srv'; // Replace 'container2' with the actual container name
let ADDR = 0;

//NOTE THIS IS ASYNC!
dns.lookup(containerName, (err, address, family) => {
  if (err) {
    console.error(`Error resolving IP address for ${containerName}:`, err);
  } else {
    ADDR = address
    console.log(`The IP address of ${containerName} is: ${address}`);
  }
});

// This works!

// ZMQ needs TCP, and you need to give the exact ip address, not hostname
console.log(ADDR);
//SOCK.connect("tcp://"+ADDR+":3000");
await SOCK.bind("tcp://"+ADDR+":3000");
console.log("port bound");
SOCK.subscribe("test");

async function recieve_message() {
    console.log("awaiting messages");
    try {
        console.log("trying recieve");
        while (true) {
            const [topic, msg] = await SOCK.receive();
            console.log("Received!");
            console.log("Received a message related to:", topic, "containing message:", msg);
        }
      } catch (err) {
        console.error("Error while receiving messages:", err);
      }
}

recieve_message();


// -------------------------------------------------

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

 //heartbeat();

app.post('/', (req, res)=> {
    console.log("Received POST request:")
    console.log(req.body);
    console.log("----------------------")
    res.send("Recieved POST request!");
})

//app.listen(3000)
