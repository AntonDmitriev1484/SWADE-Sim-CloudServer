import express from "express"

const app = express();
app.use(express.json());

app.post('/', (req, res)=> {
    console.log("Received POST request:")
    console.log(req.body);
    console.log("----------------------")
    res.send("Recieved POST request!");
})

app.listen(3000, () => {
    console.log("Listening for requests on 3000");
})