const yts = require( 'yt-search' )

let reply;

async function getData(){

	if(process.argv.length == 3){

		reply = await yts(process.argv[2]);

	}else {

		new Error("no arguement provided");
		process.exit();

	}

	console.log(reply)
}

getData();
