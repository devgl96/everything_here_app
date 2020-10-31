var convertBtn = document.querySelector('.convert-button');

convertBtn.addEventListener('click', () => {
    var URLinput = document.querySelector('.URL-input');
    var qualityVideo = document.getElementById("selectQuality").value;
    
    console.log(`URL: ${URLinput.value}`);
    console.log(`Quality Video: ${qualityVideo}`);
    
    sendURL(URLinput.value, qualityVideo);
});

function sendURL(URL, qualityVideo) {
    console.log("Send URL to Download...");
    
    // fetch(`http://localhost:4000/download?URL=${URL}`, {
    //     method:'GET'
    // }).then(res => res.json())
    // .then(json => console.log(json))
    // .catch((err) => {
    //     console.log("Can't access " + URL + " response. Blocked by browser?\n Error " + err);
    // });

    window.location.href = `http://localhost:4000/download?URL=${URL}&qualityVideo=${qualityVideo}`;
}