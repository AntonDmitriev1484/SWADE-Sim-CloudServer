import express from "express"
import  * as f from "./fetch_methods.js"
import zmq from "zeromq"
import dns from "dns"

// Using version 6 (beta) ZMQ, Node version 14

const THIS_HOST = "http://c-srv";
const THIS_PORT = 3000;
const THIS_URL = THIS_HOST + ":" + THIS_PORT + "/";
// const SUB = zmq.Subscriber();


// SOCK.message("message", 
//         ([topic, message]) => {
//             // Decomposition is lit, topic should always be "test"
//             console.log('Recieved message from edge');
//             console.log(message);
//         }
//     );

const containerName = 'e-srv'; // Replace 'container2' with the actual container name

let ADDR = 0;
//NOTE THIS IS ASYNC!
await dns.lookup(containerName, (err, address, family) => {
  if (err) {
    console.error(`Error resolving IP address for ${containerName}:`, err);
  } else {
    recieve_messages(address);
    console.log(`The IP address of ${containerName} is: ${address}`);

  }
});


const SOCK = new zmq.Subscriber

// Ok, the subscriber needs to connect to the publishers
// why was this not mentioned int ehFUCKING DOCS

// So publisher binds to a socket on itself
// subscriber connects to that socket
// THIS IS THE ONLY WAY IT WORKS
// this means that c-srv needs to maintain an active list of all 
// sockets (edge servers) that it needs to connect to receive messages
async function recieve_messages(ADDR) {
    const socketAddr = "tcp://"+ADDR+":5432";
    try {
        SOCK.connect(socketAddr); // Mayhaps wrap this in a try catch(err) block
        //Doing bind causes an error when you actually try to .receive() messages
        // But I',m pretty sure this: http://wiki.zeromq.org/area:faq
        // is saying bind should be here
        console.log("Socket bound to: "+socketAddr);
    }
    catch (err) {
        console.error("Socket binding error: ",err);
    }
    SOCK.subscribe("test");

        console.log("awaiting messages");
        try {
            console.log("trying recieve");

            // Check if there are any incoming messages

            // for await (const [topic, msg] of SOCK) {
            //     console.log("received a message related to:", topic, "containing message:", msg)
            //   }
            while (true) {
                let p = SOCK.receive();
                console.log(p)
                const [topic, msg] = await p;
                console.log("Received!");
                console.log("Received a message related to:", topic, "containing message:", msg);
            }
        } catch (err) {
            console.error("Error while receiving messages:", err);
        }


}
// ZMQ needs TCP, and you need to give the exact ip address, not hostname
//SOCK.connect("tcp://"+ADDR+":3000");


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
