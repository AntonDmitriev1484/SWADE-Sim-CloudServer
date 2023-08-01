import express from "express"
import fs from "fs"
import  * as f from "./fetch_methods.js"
import handlers from "./msg_handlers.js"
import zmq from "zeromq"
import dns from "dns"
import pg from "pg"
import FormData from "form-data"

const {build_file_upload_handler, build_live_data_handler} = handlers;


// Using version 6 (beta) ZMQ, Node version 14

const app = express();
app.use(express.json());

const DB_HOST = "cpg";
const FS_HOST = "fs";
const PG_PORT = 5432;
const EXPRESS_PORT = 3000;
const ZMQ_PORT = 3001;
let PUB_IPS = [];

const DB_CLIENT = new pg.Client({
    host: DB_HOST,
    port: PG_PORT,
    database: 'postgres',
    user: 'postgres',
    password: 'pass',
  });

// Promise resolution gives a success / failure message
async function connect_postgress() {
    await new Promise(res => setTimeout(res, 5000)); 
    // Give pg enough time to start
    // Write a connect with retry loop around DB_CLIENT.connect()
    return new Promise((resolve, reject)=> {
      DB_CLIENT.connect().then( x => {
        resolve(`Connected to ${DB_HOST}.`);
      }
      )
      .catch( err => {
        reject(`Connection to ${DB_HOST} failed.`);
      })
    })
  }


async function init_connections() {
    return connect_postgress();
}

// So publisher binds to a socket on itself, subscriber connects to that socket.
// This means that c-srv needs to maintain an active list of all 
// sockets (edge servers) that it needs to connect to receive messages.
async function sub_to_messages(pub_address, topic, action) {
    const SOCK = new zmq.Subscriber; 
    const socketAddr = "tcp://"+pub_address+":3001";
    try {
        SOCK.connect(socketAddr);
        console.log(`Socket connected to: ${socketAddr}`);
        SOCK.subscribe(topic);

        try {
            console.log(`Awaiting messages on ${topic}`);

            while (true) {
                const [topic, msg] = await SOCK.receive();

                console.log(`Received a message: `);
                console.log(JSON.parse(msg));

                action(JSON.parse(msg));

            }
        } catch (err) {
            console.error("Error while receiving messages:", err);
        }
    }
    catch (err) {
        console.error("Socket connect error: ",err);
    }
}


init_connections()
.then( value => {
    console.log('Connections initialized!');

    app.post('/register', (req, res)=> {

        const IP = req.ip.substring(7, req.ip.length); //Substring to mask out the IPv4 component
        console.log('Registering '+IP);
        PUB_IPS.push(IP);

        // When an edge server registers, create handler functions
        // for dealing with that edge server's messages on some topic.
        const TOPIC_TO_CALLBACK = {
            live_data: build_live_data_handler(DB_CLIENT, req, res),
            file_upload: build_file_upload_handler(`http://${FS_HOST}:${EXPRESS_PORT}/upload-file`, req, res),
        }

        // Bind the generated callbacks to every subscription
        req.body.topics.forEach( 
            topic => {
                // If this edge server is registering to upload files.
                // We need to create a bucket before we create a subscriber binding.
                if (topic.name === 'file_upload') {
                    f.HOFetch(`http://${FS_HOST}:${EXPRESS_PORT}/new-bucket`,
                    {
                        method: 'POST',
                        headers: {
                            "accept": "application/json",
                            "content-type": "application/json"
                        },
                        body: 
                            JSON.stringify({"bucket": topic.bucket})
                    },
                    (fs_res) => {
                        console.log(fs_res.message);
                        sub_to_messages(IP, topic.name, TOPIC_TO_CALLBACK[topic.name]);
                        res.send(fs_res.message);
                    }
                    )
                }
                else {
                    sub_to_messages(IP, topic.name, TOPIC_TO_CALLBACK[topic.name]);
                }
            }
        );

        // Need to build up a res object and then send it here
        // Sending it within the lambda keeps it from being written down here
    })

})
.catch( err => {
    console.log(`Problem initializing cloud server connections: ${err}`);
})



app.listen(EXPRESS_PORT, () => {
    console.log("Listening on port 3000");
});

