const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const fs = require('fs');

// New retry
const ffmpeg = require('ffmpeg-static');
const cp = require('child_process');
const readline = require('readline');

const app = express();

var downloadFolder = process.env.USERPROFILE + "/Downloads";

const showKeywords = (keywords) => {
    console.log("Show the Keywords PLEASE");
    for (keyword of keywords) {
        console.log("Keyword: " + keyword);
    }
}

app.use(cors());

app.listen(4000, () => {
    console.log('Server Works !!! At port 4000');
});

app.get('/download', async (require, response) => {
    // console.log("Downloading Ready!...");
    let URL = require.query.URL;
    let qualityVideo = require.query.qualityVideo;

    let info = await ytdl.getInfo(URL);

    console.log(
        `URL Video: ${URL}\n
        Title Video: ${info.videoDetails.title}\n
        Author Video: ${info.videoDetails.author.name}\n
        `
    );
    // Keywords Length: ${info.videoDetails.keywords.length}\n
    // Keywords: ${showKeywords(info.videoDetails.keywords)}\n
   
    // New Retry Coding
    response.send(console.log("Download Beginning..."));

    // Change the slash of directory 
    downloadFolder = downloadFolder.split("\\").join("/");

    // Show the quality choose for user
    console.log(qualityVideo);


    const tracker = {
        start: Date.now(),
        audio: { downloaded: 0, total: Infinity },
        video: { downloaded: 0, total: Infinity },
        merged: { frame: 0, speed: '0x', fps: 0 },
      };
      
      // Get audio and video stream going
      const audio = ytdl(URL, { filter: 'audioonly', quality: 'highestaudio' })
        .on('progress', (_, downloaded, total) => {
          tracker.audio = { downloaded, total };
        });
      const video = ytdl(URL, { filter: 'videoonly', quality: 'highestvideo' })
        .on('progress', (_, downloaded, total) => {
          tracker.video = { downloaded, total };
        });
      
      // Get the progress bar going
      const progressbar = setInterval(() => {
        readline.cursorTo(process.stdout, 0);
        const toMB = i => (i / 1024 / 1024).toFixed(2);
      
        process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
        process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);
      
        process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
        process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);
      
        process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
        process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);
      
        process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
        readline.moveCursor(process.stdout, 0, -3);
      }, 1000);
      
      // Start the ffmpeg child process
      const ffmpegProcess = cp.spawn(ffmpeg, [
        // Remove ffmpeg's console spamming
        '-loglevel', '0', '-hide_banner',

        // Redirect/enable progress messages
        '-progress', 'pipe:3',

        // 0.0 second audio offset
        '-itsoffset', '0.0', '-i', 'pipe:4',
        '-i', 'pipe:5',

        // Rescale the video => 
        // It Works: scale=320:240(QVGA), scale=640:480(VGA), scale=768:576(SD), scale=1280:720(HD)
        // Not works: scale=1920:1080(HD)
        '-vf', `scale=${qualityVideo}`,

        // Choose some fancy codes
        // '-c:v', 'libx265', '-x265-params', 'log-level=0',
        // '-c:a', 'flac',
        '-c:v', 'libx264', '-x265-params', 'log-level=0',
        '-c:a', 'aac',

        // Define output container
        '-f', 'matroska', 'pipe:6',
      ], {
        windowsHide: true,
        stdio: [
          /* Standard: stdin, stdout, stderr */
          'inherit', 'inherit', 'inherit',
          /* Custom: pipe:3, pipe:4, pipe:5, pipe:6 */
          'pipe', 'pipe', 'pipe', 'pipe',
        ],
      });
      ffmpegProcess.on('close', () => {
        process.stdout.write('\n\n\n\n');
        clearInterval(progressbar);
        console.log('done');
      });
      
      // Link streams
      // FFmpeg creates the transformer streams and we just have to insert / read data
      ffmpegProcess.stdio[3].on('data', chunk => {
        // Parse the param=value list returned by ffmpeg
        const lines = chunk.toString().trim().split('\n');
        const args = {};
        for (const l of lines) {
          const [key, value] = l.trim().split('=');
          args[key] = value;
        }
        tracker.merged = args;
      });
      audio.pipe(ffmpegProcess.stdio[4]);
      video.pipe(ffmpegProcess.stdio[5]);

      ffmpegProcess.stdio[6].pipe(fs.createWriteStream(`${downloadFolder}/${info.videoDetails.title.replace(/\s[|&;$%@"<>()+,]/g, '')}.mp4`));
      //ffmpegProcess.stdio[6].pipe(fs.createWriteStream(`${downloadFolder}/somethingWrong.mp4`));
});