import express from "express"
import  * as f from "./fetch_methods.js"

const app = express();
app.use(express.json());

function heartbeat() {
    const timer = 1000*30; //30s
    const endpoint = "http://e-srv:3000/sync";

    setInterval(() => {
        f.HOFetch(
            endpoint, 
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            },
            (response) => {
                // Update database using response
            }
        )
        
        }, 
    timer);
}



app.post('/', (req, res)=> {
    console.log("Received POST request:")
    console.log(req.body);
    console.log("----------------------")
    res.send("Recieved POST request!");
})

app.listen(3000, () => {
    f.test_put();
})