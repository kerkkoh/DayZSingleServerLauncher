const host = {
	domain: "127.0.0.1",
	path: "/dayzrp.zip"
}

const {app, BrowserWindow, ipcMain} = require("electron");

const path = require('path')
const url = require('url')
const fs = require('fs')
const {download} = require("electron-dl")
const rimraf = require('rimraf')
const http = require('http')
const extract = require('extract-zip')

//Figure out if the settings exists and if not, create the default settings
const spath = path.join(app.getPath('userData'), 'settings.json')

//let settings = JSON.stringify({"packpath":"RPFramework\\pack.bat","buildpath":"RPFramework\\build.bat","srvrpath":"C:\\Program Files (x86)\\Steam\\steamapps\\common\\Arma 3\\arma3server_x64.exe","params":"-port=2302 \"-config=C:\\Program Files (x86)\\Steam\\steamapps\\common\\Arma 3\\TADST\\rpf\\TADST_config.cfg\" \"-cfg=C:\\Program Files (x86)\\Steam\\steamapps\\common\\Arma 3\\TADST\\rpf\\TADST_basic.cfg\" \"-profiles=C:\\Program Files (x86)\\Steam\\steamapps\\common\\Arma 3\\TADST\\rpf\" -name=rpf -pid=pid.log -ranking=ranking.log \"-mod=@extDB3;@RPF_Server;@RPFramework\"","logs":"C:\\Program Files (x86)\\Steam\\steamapps\\common\\Arma 3\\TADST\\rpf"})
let settings = JSON.stringify({"dayzpath": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\DayZ", "charname": "FirstName LastName", "version": "-1", "last-modified": "-1"})

if (fs.existsSync(spath)) {
	settings = fs.readFileSync(spath)
} else {
	fs.mkdirSync(app.getPath('userData'))
	fs.writeFile(spath, settings, (err) => {if (err) throw err})
}
let settingsData = JSON.parse(settings)

let version = "-1";
const versionPath = JSON.parse(settings).dayzpath+"\\dayzrp\\VERSION"

if (fs.existsSync(versionPath)) {
	version = fs.readFileSync(versionPath)
}
settingsData.version = version;

const hbs = require('electron-handlebars')({
  title: app.getName(),
  data: settingsData,
  installed: (version != "-1"),
  version: app.getVersion()
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
	mainWindow = new BrowserWindow({width: 750, height: 320, frame: false/*, resizable: false*/, backgroundColor: '#121212'})

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.hbs'),
		protocol: 'file:',
		slashes: true
	}))

	ipcMain.on("download", (event, info) => {
		
		//save shit
		settingsData.dayzpath = info.dayzpath;
		settingsData.charname = info.charname;
		settings = JSON.stringify(settingsData);
		fs.writeFile(spath, settings, (err) => {if (err) throw err})
		
		//let's ask the server if there's been an udpate
		let req = http.request({method: 'HEAD', host: host.domain, port: 80, path: host.path}, (res) => {
			if (res.headers["last-modified"] != settingsData["last-modified"]) {
				console.log("Mismatch: "+res.headers["last-modified"]+" != "+settingsData["last-modified"]);
				//update settings with last modified
				settingsData["last-modified"] = res.headers["last-modified"]
				
				if (fs.existsSync(`${info.dayzpath}\\dayzrp`)) {
					rimraf(`${info.dayzpath}\\dayzrp`, (err) => {
						if (err) throw err;
					})
				}
				download(BrowserWindow.getFocusedWindow(), "http://"+host.domain+host.path, {directory: `${app.getPath("userData")}\\mods`})
				.then(dl => {
					let file = dl.getSavePath()
					extract(file, {dir: info.dayzpath}, function (err) {
						if (err) throw err
						fs.unlink(file, (err) => {
						  if (err) throw err
						})
						
						version = fs.readFileSync(info.dayzpath+"\\dayzrp\\VERSION")
						settingsData.version = version
						settings = JSON.stringify(settingsData)
						fs.writeFile(spath, settings, (err) => {if (err) throw err})
						mainWindow.webContents.send("download complete", {version: settingsData.version})
					})
				})
			} else {
				console.log("no mismatch found");
				mainWindow.webContents.send("download complete", {version: settingsData.version})
			}
		})
		req.end()
	})

	// mainWindow.webContents.openDevTools()

	mainWindow.on('closed', function () {
		mainWindow = null
	})
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})