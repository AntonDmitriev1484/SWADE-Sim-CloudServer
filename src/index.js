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

// NOTE: THIS WAS e-srv1 before! Change back if necessary
//const PUB_NAME = `e-srv${process.env.EDGE_ID}`; //Use the e-srv's alias on SWADE-net

let PUB_IPS = [];

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

// So publisher binds to a socket on itself, subscriber connects to that socket.
// This means that c-srv needs to maintain an active list of all 
// sockets (edge servers) that it needs to connect to receive messages.
async function sub_to_messages(pub_address, topic) {
    const SOCK = new zmq.Subscriber; 
    // Need 1 subscriber socket per connection
    // But is this really how this is supposed to work? Am I missing the point?
    const socketAddr = "tcp://"+pub_address+":3001";
    try {
        SOCK.connect(socketAddr);
        console.log("Socket connected to: "+socketAddr);
        SOCK.subscribe(topic);

        // I think this is connecting to the wrong address (DNS Lookup)
        // So lets implement that registration system

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

app.get('/register', (req, res)=> {
    const IP = req.ip.substring(7, req.ip.length); //Substring to mask out the IPv4 component
    console.log('Registering '+IP);
    PUB_IPS.push(IP);
    sub_to_messages(IP, "Test");
    res.send({message: "Cloud has registered this server ip!", swadenetIP: IP})
})

app.listen(3000)

