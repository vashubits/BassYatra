async function fetchFolders() {
  const res = await fetch('songs.json');
  return res.json();
}

async function main() {
  const data = await fetchFolders();
  const container = document.querySelector('.cardcontainer');
  data.forEach(artist => {
    container.innerHTML += `
      <div class="card" data-folder="${artist.folder}">
        <img src="${artist.image}" alt="">
        <span>${artist.title}</span>
        <p>${artist.desc}</p>
      </div>`;
  });

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
      const artist = data.find(a => a.folder === card.dataset.folder);
      const ul = document.querySelector('.songList ul');
      ul.innerHTML = '';
      artist.mp3files.forEach(song => {
        ul.innerHTML += `
          <li>
            <div class="songname">${song}</div>
            <div>Play Now <img src="play.svg" alt=""></div>
          </li>`;
      });

      document.querySelectorAll('.songList ul li').forEach(item => {
        item.addEventListener('click', () => {
          const song = item.querySelector('.songname').textContent;
          playSong(`songs/${artist.folder}/${encodeURIComponent(song)}`);
        });
      });
    });
  });
}
