import express from "express"
import  * as f from "./fetch_methods.js"
import zmq from "zeromq"
import dns from "dns"
import pg from "pg"

// Using version 6 (beta) ZMQ, Node version 14

const app = express();
app.use(express.json());

const THIS_HOST = "c-srv";
const THIS_PORT = 3000;
const THIS_URL = `http://${THIS_HOST}:${THIS_PORT}/`;

const PG_PORT = 5432;
const EXPRESS_PORT = 3000;
const ZMQ_PORT = 3001;

const SOCK = new zmq.Subscriber
const PUB_NAME = 'e-srv'; //At the moment, assuming there is only one

const DB_CLIENT = new pg.Client({
    host: 'cpg',
    port: PG_PORT,
    database: 'postgres',
    user: 'postgres',
    password: 'pass',
  })

  await new Promise(res => setTimeout(res, 5000)); 


DB_CLIENT.connect().then( x => {
    console.log('Client connected to pg')
    //init_query_endpoints();
}
)
.catch( error => {
    console.log('Error connecting to pg: '+error);
}
);

// The parameter lambda function is used asynchronously, had to resolve by nesting.
// Find publisher ip, pass that into a function that subscribes to messages
// at that address.
dns.lookup(PUB_NAME, (err, address, family) => {
  if (err) {
    console.error(`Error resolving IP address for ${PUB_NAME}:`, err);
  } else {
    console.log(`DNS lookup successful, subscribing to messages at ${address}:5432`);
    sub_to_messages(address, "Test");
  }
});

// So publisher binds to a socket on itself, subscriber connects to that socket.
// This means that c-srv needs to maintain an active list of all 
// sockets (edge servers) that it needs to connect to receive messages.
async function sub_to_messages(pub_address, topic) {
    const socketAddr = "tcp://"+pub_address+":3001";
    try {
        SOCK.connect(socketAddr);
        console.log("Socket connected to: "+socketAddr);
        SOCK.subscribe(topic);

        try {
            console.log("Awaiting messages");
            while (true) {
                const [topic, msg] = await SOCK.receive();
                console.log(`Received a message: ${msg}`);

                // At the moment, msg is a buffer
                console.log(msg.toString());
                DB_CLIENT.query(msg.toString()).then(
                    x => {
                        console.log('Query applied to cloud postgres successfully!');
                    }
                )
                .catch(
                    err => {
                        console.log('Query failed on cloud postgres: '+err);
                    }
                )
            }
        } catch (err) {
            console.error("Error while receiving messages:", err);
        }
    }
    catch (err) {
        console.error("Socket connect error: ",err);
    }

}

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
