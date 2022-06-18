// const ytdl = require('ytdl-core');
// const ffmpeg = require('fluent-ffmpeg')
// const Speaker = require('speaker')
// const Decoder = require('minimp3')


// var dl = ytdl("https://youtube.com/watch?v=4_EkB5tSmPY", {
// 	filter: function(format) { return format.container === 'mp4'; }
// }).pipe(new Decoder()).pipe(new Speaker())

// var converter = ffmpeg(dl).format('mp3').pipe(new Decoder()).on('format', function (format) {
// 	this.pipe(new Speaker(format));
// });

var ytdl = require('ytdl-core');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
var Speaker = require('speaker');
const Decoder = require('minimp3')
const readline = require('readline');

const decoder = new Decoder()
const speaker = new Speaker()



var dl = ytdl(process.argv[2], {
	quality: 'highestaudio',
	filter: 'audioonly'
})
ffmpeg(dl).save(`${__dirname}/temp.mp3`).on('end',()=>{
	fs.createReadStream(`${__dirname}/temp.mp3`).pipe(decoder).pipe(speaker)

})

