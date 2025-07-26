let songsUl = [];
let currentFolder;
let currentAudio = null;

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    let mins = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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

async function getSong(folder) {
    let response = await fetch(`songs/${folder}/info.json`);
    let data = await response.json();
    return data.mp3files || [];
}

async function fetchFolders() {
    let f = await fetch("songs.json");
    let folders = await f.json();

    for (const folder of folders) {
        document.querySelector(".cardcontainer").innerHTML += `
        <div class="card" data-folder="${folder.folder}">
            <img src="${folder.image}" alt="" />
            <span>${folder.title}</span>
            <p>${folder.desc}</p>
        </div>`;
    }

    return folders.map(f => f.folder);
}

async function main() {
    let folderList = await fetchFolders();

    document.querySelectorAll(".card").forEach(item => {
        item.addEventListener("click", async () => {
            let folder = item.dataset.folder;
            currentFolder = folder;
            songsUl = await getSong(folder);

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
                    let url = `songs/${folder}/${encodedName}`;
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
            playSong(`songs/${currentFolder}/${encodeURIComponent(previousSong)}`);
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
            playSong(`songs/${currentFolder}/${encodeURIComponent(nextSong)}`);
            document.getElementById("play").src = "pause.svg";
        }
    });

    // Seekbar
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");
    let isDragging = false;

    circle.addEventListener("mousedown", () => {
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
