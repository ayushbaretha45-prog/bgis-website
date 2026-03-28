const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://Ayush:Ayush123@ayush.zhhndi4.mongodb.net/bgis")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const teamSchema = new mongoose.Schema({
  name: String,
  matches: { type: Number, default: 0 },
  kills: { type: Number, default: 0 },
  placement: { type: Number, default: 0 },
  points: { type: Number, default: 0 }
});

const Team = mongoose.model("Team", teamSchema);
async function  {
  const count = await Team.countDocuments();
  if (count === 0) {
    await Team.insertMany([
      { name:"iQOO SOUL" },
      { name:"iQOO ORANGUTAN" },
      { name:"GENESIS ESPORTS" },
      { name:"Learn From Past" },
      { name:"iQOO RECKONING ESPORTS" },
      { name:"iQOO Revenant Xspark" },
      { name:"Victores Sumus" },
      { name:"Meta Ninza" },
      { name:"Hero Xtreme Godlike" },
      { name:"WELT E-Sports" },
      { name:"Nebula Esports" },
      { name:"MYTH OFFICIAL" },
      { name:"Wyld Fangs" },
      { name:"K9 Esports" },
      { name:"iQOO Team Tamilas" },
      { name:"Vasista Esports" }
    ]);
    console.log("Teams inserted");
  }
}

seedTeams();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = new Server(server);



// Hardcoded admin users
const users = [
  { username: "ayush", password: "ayush@123" },
  { username: "aditya", password: "aditya@123" }
];

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: "bgisSecretKey", 
    resave: false,
    saveUninitialized: false
}));

// Middleware to protect admin
function checkAuth(req, res, next){
    if(req.session.user){
        next();
    } else {
        res.redirect("/login");
    }
}

// Login Page
app.get("/login", (req, res)=>{
    res.render("login", { error: null });
});

// Login POST
app.post("/login", (req, res)=>{
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if(user){
        req.session.user = user.username;
        res.redirect("/admin");
    } else {
        res.render("login", { error: "Invalid username or password" });
    }
});

// Logout
app.get("/logout", (req,res)=>{
    req.session.destroy();
    res.redirect("/login");
});

// Main dashboard
app.get("/", async (req, res) => {
  let teams = await Team.find();
  teams.forEach(team => team.points = team.kills + team.placement);
  teams.sort((a,b)=> b.points - a.points);
  res.render("index", { teams });
});

// Admin page (protected)
app.get("/admin", checkAuth, async (req, res) => {
  let teams = await Team.find();
  res.render("admin", { teams, user: req.session.user });
});

// Update team kills/placement
app.post("/update", checkAuth, async (req, res) => {
  const { team, matches, addKills, addPlacement, kills, placement } = req.body;

  const selected = await Team.findOne({ name: team });

  if (selected) {

    // ✅ DIRECT SET (even 0 works)
    if (kills !== "") selected.kills = parseInt(kills);
    if (placement !== "") selected.placement = parseInt(placement);

    // ✅ ADD SYSTEM
    if (addKills) selected.kills += parseInt(addKills);
    if (addPlacement) selected.placement += parseInt(addPlacement);

    // ✅ MATCHES
    if (matches !== "") selected.matches = parseInt(matches);

    // ✅ POINTS CALC
    selected.points = selected.kills + selected.placement;

    await selected.save();
  }

  let teams = await Team.find();
  teams.sort((a,b)=> b.points - a.points);

  io.emit("updateTable", teams);
  res.redirect("/admin");
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
