import express from "express"
import  * as f from "./fetch_methods.js"
import zmq from "zeromq"
import dns from "dns"
import pg from "pg"

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
                console.log(msg.toString());

                action(msg);

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
        // TODO: req is also where edge servers will pass in their topics
        const IP = req.ip.substring(7, req.ip.length); //Substring to mask out the IPv4 component
        console.log('Registering '+IP);
        PUB_IPS.push(IP);

        // Each unique registration might result in different functions
        const TOPIC_TO_CALLBACK = {
            live_data: (msg) => {
                // On a 'live_data' message. Forward the data to the cloud database
                // by running a query.
                const query_text = msg.query.toString();
                DB_CLIENT.query(query_text).then(
                    x => {
                        console.log('Query applied to cloud postgres successfully!');
                    }
                )
                .catch(
                    err => {
                        console.log('Query failed on cloud postgres: '+err);
                    }
                )
            },
            file_upload: (msg) => {
                // On a 'file_upload' message. Forward the message to the file system
                // TEST 2: File upload endpoint successful
                f.HOFetch(`http://${FS_HOST}:${EXPRESS_PORT}/create-file`,
                {
                    method: 'POST',
                    headers: {
                        "accept": "application/json",
                        "content-type": "application/json"
                    },
                    body: 
                        JSON.stringify(msg)
                },
                (fs_res) => {
                    console.log(fs_res.message);
                    res.send(fs_res);
                }
                )

            }

        }

        // Bind the generated callbacks to every subscription
        req.body.topics.forEach( topic => {
            // If this edge server is registering to upload files.
            // We need to create a bucket, before we create a subscriber binding.
            if (topic.name === 'file_upload') {
                // TEST 1: Bucket creation endpoint successful
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
        });

        // res.send({message: "Cloud has registered this server ip!"})
    })

})
.catch( err => {
    console.log(`Problem initializing cloud server connections: ${err}`);
})



app.listen(EXPRESS_PORT, () => {
    console.log("Listening on port 3000");
});

