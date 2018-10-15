const $ = require('jquery');
const child_process = require('child_process');
const fs = require('fs');
const eapp = require('electron').remote.app;
const {ipcRenderer} = require('electron');

//Navbar actions
$("#ext").click(() => {
	require('electron').remote.app.quit();
});

$("#minim").click(() => {
	require('electron').remote.getCurrentWindow().minimize();
});

//Handle events from main.js
ipcRenderer.on("download complete", (event, data) => {
	$( "#version" ).text(data.version);
	//launchGame();
	console.log("Would launch game here");
});

const launchGame = () => {
	let dayzpath = $('#dayzpath').val();
	let charname = $('#charname').val();
	let file = `"${dayzpath}\\DayZ_BE.exe" "-name=${charname}" -mod=dayzrp -connect=s1.dayzrp.com -port=2300`;
	let path = eapp.getPath("userData") + '\\launch.bat';
	fs.writeFile(path, file, (err) => {
		if (err) throw err;
		console.log(`DayZ startup file created at ${path}`);
		child_process.exec(path, function(error, stdout, stderr) {});
	});
}
$( "#launch" ).click(() => {
	ipcRenderer.send("download", {
		dayzpath: $('#dayzpath').val(),
		charname: $('#charname').val()
	});
});