const { desktopCapturer, remote } = require("electron");
const { writeFile } = require("fs");
const videoElement = document.querySelector("video");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const videoSelectBtn = document.getElementById("videoSelect");

let mediaRecorder;
const videoChunks = [];

stopBtn.addEventListener("click", () => {
  mediaRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
});

startBtn.addEventListener("click", () => {
  mediaRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
});

videoSelectBtn.addEventListener("click", getVideoSources);

async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });

  const menuItems = inputSources.map((source) => {
    return {
      label: source.name,
      click: () => selectSource(source),
    };
  });
  const videoOptionsMenu = remote.Menu.buildFromTemplate(menuItems);

  videoOptionsMenu.popup();
}

async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
      },
    },
  });

  videoElement.srcObject = stream;
  videoElement.play();

  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(event) {
  videoChunks.push(event.data);
}

async function handleStop(event) {
  const blob = new Blob(videoChunks, { type: "video/webm; codecs=vp9" });
  const buff = Buffer.from(await blob.arrayBuffer());
  const { filePath } = await remote.dialog.showSaveDialog({
    buttonLabel: "Save Video",
    defaultPath: `video-${Date.now()}.webm`,
  });
  if (filePath) writeFile(filePath, buff, () => console.log("video saved ..."));
}
