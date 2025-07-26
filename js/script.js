let songsUl = [];
let currentFolder;
async function getSong(folder) {
    let songs = [];
    let f = await fetch(`songs/${folder}`);
    let response = await f.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let a = div.getElementsByTagName("a");
    let arr = Array.from(a);
    for (const e of arr) {
        if (e.href.endsWith(".mp3")) {
            songs.push(decodeURIComponent(e.href.split("/").pop()));
        }
    }
    return songs;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

let currentAudio = null;

function playSong(url) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }

    currentAudio = new Audio(url);
    currentAudio.play();

    currentAudio.addEventListener("timeupdate", () => {
        document.querySelector(".time").innerHTML = formatTime(currentAudio.currentTime);
        document.querySelector(".duration").innerHTML = formatTime(currentAudio.duration);

        const percent = (currentAudio.currentTime / currentAudio.duration) * 100;
        document.querySelector(".circle").style.left = `${percent}%`;
    });
}
async function fetchFolders() {
    let f = await fetch("songs/");
    let text = await f.text();

    let div = document.createElement("div");
    div.innerHTML = text;

    let links = Array.from(div.querySelectorAll("a"));

    let folders = links
        .map(a => a.getAttribute("href"))
        .filter(href =>
            href &&
            !href.includes("..") &&
            href.trim().endsWith("/")
        )
        .map(href => {
            return href.replace(/\\/g, "/").replace("/songs/", "").replace(/\/$/, "");
        });

    console.log("Folders found:", folders);
    return folders;
}


async function main() {
    let folderName = await fetchFolders();
    for (const e of folderName) {
        let f = await fetch(`songs/${e}/info.json`);
        let response = await f.json();
        document.querySelector(".cardcontainer").innerHTML += `<div class="card" data-folder = ${e}>
          <img src="songs/${e}/coverImg.jpeg" alt="" />
          <span> ${response.title}</span>
          <p>${response.desc}</p>
        </div>` ;
    }
       document.querySelectorAll(".card").forEach(item => {
        item.addEventListener("click", async () => {
          let  folder =  item.dataset.folder;
          console.log(folder)
          currentFolder = folder;
           songsUl = await getSong(folder);
           console.log(songsUl);
            let songlist = document.querySelector(".songList ul");
            songlist.innerHTML = "";

    for (const e of songsUl) {
        songlist.innerHTML += `
            <li>
                <div class="songname">${e}</div>
               
                <div> Play Now <img src="play.svg" alt=""></div>
            </li>`;
    }

    document.querySelectorAll(".songList ul li").forEach(item => {
        item.addEventListener("click", () => {
            let name = item.querySelector(".songname").innerHTML;
            let encodedName = encodeURIComponent(name);
            let url = `http://127.0.0.1:3000/songs/${folder}/${encodedName}`;
            document.getElementById("play").src = "pause.svg";
            playSong(url);
        });
    });



    
   
        });
    });

    document.getElementById("play").addEventListener("click", () => {
        if (currentAudio.paused) {
            currentAudio.play();
            document.getElementById("play").src = "pause.svg";
        } else {
            currentAudio.pause();
            document.getElementById("play").src = "pplay.svg";
        }
    });

    document.getElementById("previous").addEventListener("click", () => {
        if (!currentAudio) return;
        let url = currentAudio.src;
        let currentFile = decodeURIComponent(url.split("/").pop());
        let index = songsUl.indexOf(currentFile);
        if (index > 0) {
            let previousSong = songsUl[index - 1];
            playSong(`http://127.0.0.1:3000/songs/${currentFolder}/${encodeURIComponent(previousSong)}`);
            document.getElementById("play").src = "pause.svg";
        }
    });

    document.getElementById("next").addEventListener("click", () => {
        if (!currentAudio) return;
        let url = currentAudio.src;
        let currentFile = decodeURIComponent(url.split("/").pop());
        let index = songsUl.indexOf(currentFile);
        if (index < songsUl.length - 1) {
            let nextSong = songsUl[index + 1];
            playSong(`http://127.0.0.1:3000/songs/${currentFolder}/${encodeURIComponent(nextSong)}`);
            document.getElementById("play").src = "pause.svg";
        }
    });

    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");
    let isDragging = false;

    circle.addEventListener("mousedown", (e) => {
        isDragging = true;
        document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging || !currentAudio || !currentAudio.duration) return;
        const rect = seekbar.getBoundingClientRect();
        let offsetX = e.clientX - rect.left;
        offsetX = Math.max(0, Math.min(offsetX, rect.width));
        const percent = offsetX / rect.width;
        circle.style.left = `${percent * 100}%`;
        currentAudio.currentTime = percent * currentAudio.duration;
    });

    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = "";
        }
    });

  

}
main();
