

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


 // It must've found e-srv in swade-net and connected
// dns.lookup(PUB_NAME, (err, address, family) => {
//   if (err) {
//     console.error(`Error resolving IP address for ${PUB_NAME}:`, err);
//   } else {
//     console.log(`DNS lookup successful, subscribing to messages at ${address}:${ZMQ_PORT}`);
//     //sub_to_messages(address, "Test");
//   }
// });