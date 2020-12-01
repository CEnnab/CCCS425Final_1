let bodyParser = require('body-parser');
let express = require('express');
let cors = require('cors');
let morgan = require('morgan');

let app = express();

app.use(bodyParser.raw({ type: "*/*" }));
app.use(cors());
app.use(morgan('combined'));

let userLogin = new Map()
let channel = new Map()
let loggedUsers = new Map()

let userToken = 0
let counter = 0

let genSessionId = () => {
    counter++
    return "token" + counter
}

let getKey =(userGiven) =>{
  
  let targetToken
  for (let [key, value] of loggedUsers) {
      if (value === userGiven)
          targetToken = key
    }
  
  return targetToken
  
}
          




app.post("/signup", (req, res) => {
  
  let parsedBody = JSON.parse(req.body)
  let userGiven = parsedBody.username
  let passwordGiven = parsedBody.password
  if (userGiven === undefined){
    res.send(JSON.stringify({ success: false, reason: "username field missing" }))
  }
  else if (passwordGiven === undefined){
    res.send(JSON.stringify({ success: false, reason: "password field missing" }))
  }  
  else if (userLogin.has(userGiven)){
    res.send(JSON.stringify({ success: false, reason: "Username exists" }))
  }
  else {
    // userLogin.set (userGiven,passwordGiven)
    userLogin.set (userGiven,passwordGiven)
    res.send(JSON.stringify({ success: true}))
  }  
})


app.post("/login", (req, res) => {
  
  let parsedBody = JSON.parse(req.body)
  let userGiven = parsedBody.username
  let passwordGiven = parsedBody.password
  let expectedPassword = userLogin.get(userGiven)
  
  if (userGiven === undefined)
    res.send(JSON.stringify({ success: false, reason: "username field missing" }))
  else if (passwordGiven === undefined)
    res.send(JSON.stringify({ success: false, reason: "password field missing" })) 
  else if (!userLogin.has(userGiven))
    res.send(JSON.stringify({ success: false, reason: "User does not exist"}))
  else if (passwordGiven != expectedPassword)
    res.send(JSON.stringify({ success: false, reason: "Invalid password"}))
  else {
    userToken = genSessionId()
    loggedUsers.set (userToken,userGiven)
    res.send(JSON.stringify({ success: true, token: userToken}))
  } 
})

app.post("/create-channel", (req, res) => {
  
  
  let userToken = req.headers["token"]
  let parsedBody = JSON.parse(req.body)
  let channelName = parsedBody.channelName
  
  if (userToken === undefined)
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
  else if (!loggedUsers.has(userToken))
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
  else if (channelName === undefined)
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
  else if (channel.has(channelName))
    res.send(JSON.stringify({ success: false, reason: "Channel already exists" }))
  else{
    channel.set (channelName,{creator: userToken, banList: new Map(), userList: new Map(), messages: []})
    res.send(JSON.stringify({ success: true}))
  }
})

app.post("/join-channel", (req, res) => {
  
  
  let userToken = req.headers["token"]
  let parsedBody = JSON.parse(req.body)
  let channelName = parsedBody.channelName
  let expectedChannelName = channel.get(channelName)
  
  if (userToken === undefined)
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
  else if (!loggedUsers.has(userToken))
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
  else if (channelName === undefined)
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
  else if (!channel.has(channelName))
    res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
  else if (channel.get(channelName)["userList"].has(userToken))
    res.send(JSON.stringify({ success: false, reason: "User has already joined" }))
  else if (channel.get(channelName)["banList"].has(userToken))  
    res.send(JSON.stringify({ success: false, reason: "User is banned" }))    
  else {
    channel.get(channelName)["userList"].set(userToken, loggedUsers.get(userToken))
    res.send(JSON.stringify({ success: true}))
  } 
})

app.post("/leave-channel", (req, res) => {
  
  
  let userToken = req.headers["token"]
  let parsedBody = JSON.parse(req.body)
  let channelName = parsedBody.channelName
  
  if (userToken === undefined)
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
  else if (!loggedUsers.has(userToken))
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
  else if (channelName === undefined)
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
  else if (!channel.has(channelName))
    res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
  else if (!channel.get(channelName)["userList"].has(userToken))
    res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" })) 
  else {
    channel.get(channelName)["userList"].delete(userToken)
    res.send(JSON.stringify({ success: true}))
  } 
})

app.get("/joined", (req, res) => {
  
  
  let channelName = req.query.channelName
  let userToken = req.headers["token"]
  
  if (userToken === undefined)
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
  else if (channelName === undefined)
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
  else if (!loggedUsers.has(userToken))
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
  else if (!channel.has(channelName))
    res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
  else if (!channel.get(channelName)["userList"].has(userToken))
    res.send(JSON.stringify({ success: false, reason: "User is not part of this channel" })) 
  else {
    let joinedList = []
    let userList = channel.get(channelName)["userList"]
    for (let [key, value] of userList) {
      joinedList.push(userList.get(key))
    }
    res.send(JSON.stringify({ success: true, joined: joinedList}))
  } 
})


app.post("/delete", (req, res) => {
  
  
  let parsedBody = JSON.parse(req.body)
  let channelName = parsedBody.channelName
  let userToken = req.headers["token"]
  
  if (userToken === undefined)
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
  else if (channelName === undefined)
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
  else if (!loggedUsers.has(userToken))
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
  else if (!channel.has(channelName))
    res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
  else { 
    channel.delete(channelName)
    res.send(JSON.stringify({ success: true}))
  } 
})


app.post("/kick", (req, res) => {
  
  
  let parsedBody = JSON.parse(req.body)
  let channelName = parsedBody.channelName
  let userGiven = parsedBody.target
  let userToken = req.headers["token"]
  
  if (userToken === undefined)
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
  else if (channelName === undefined)
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
  else if (userGiven === undefined)
      res.send(JSON.stringify({ success: false, reason: "target field missing" }))
  else if (!loggedUsers.has(userToken))
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
  else if (userToken != channel.get(channelName)["creator"])
      res.send(JSON.stringify({ success: false, reason: "Channel not owned by user" }))
  else if (!channel.has(channelName))
    res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
  else { 
    channel.get(channelName)["userList"].delete(getKey(userGiven))
    res.send(JSON.stringify({ success: true}))
  } 
})


app.post("/ban", (req, res) => {
  
  
  let parsedBody = JSON.parse(req.body)
  let channelName = parsedBody.channelName
  let userGiven = parsedBody.target
  let userToken = req.headers["token"]
  
  if (userToken === undefined)
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
  else if (channelName === undefined)
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
  else if (userGiven === undefined)
      res.send(JSON.stringify({ success: false, reason: "target field missing" }))
  else if (!loggedUsers.has(userToken))
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
  else if (userToken != channel.get(channelName)["creator"])
      res.send(JSON.stringify({ success: false, reason: "Channel not owned by user" }))
  else if (!channel.has(channelName))
    res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
  else { 
    channel.get(channelName)["banList"].set(getKey(userGiven), userGiven)
    res.send(JSON.stringify({ success: true}))
  } })



app.post("/message", (req, res) => {
  
  
  let parsedBody = JSON.parse(req.body)
  let channelName = parsedBody.channelName
  let contents = parsedBody.contents
  let userToken = req.headers["token"]
  
  if (userToken === undefined)
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
  else if (channelName === undefined)
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
  else if (contents === undefined)
      res.send(JSON.stringify({ success: false, reason: "contents field missing" }))
  else if (!loggedUsers.has(userToken))
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
  else if (!channel.has(channelName) || !channel.get(channelName)["userList"].has(userToken))
    res.send(JSON.stringify({ success: false, reason: "User is not part of this channel"}))
  else { 
    
    let dm = {"from": loggedUsers.get(userToken), "contents": contents}
    channel.get(channelName)["messages"].push(dm)
    res.send(JSON.stringify({success: true}))
  } 
})

app.get("/messages", (req, res) => {
  
  
  let channelName = req.query.channelName
  let userToken = req.headers["token"]
  
  if (userToken === undefined)
      res.send(JSON.stringify({ success: false, reason: "token field missing" }))
  else if (channelName === undefined)
      res.send(JSON.stringify({ success: false, reason: "channelName field missing" }))
  else if (!loggedUsers.has(userToken))
      res.send(JSON.stringify({ success: false, reason: "Invalid token" }))
  else if (!channel.has(channelName))
    res.send(JSON.stringify({ success: false, reason: "Channel does not exist" }))
  else if (!channel.get(channelName)["userList"].has(userToken))
    res.send(JSON.stringify({ success: false, reason: "User is not part of this channel"}))
  else { 
    res.send(JSON.stringify({ success: true, messages: channel.get(channelName)["messages"]}))
  } 
})


app.get("/sourcecode", (req, res) => {
    res.send(require('fs').readFileSync(__filename).toString())
});
app.listen(process.env.PORT || 3000)