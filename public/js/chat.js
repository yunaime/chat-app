const socket = io();

// const form = document.querySelector('form');
// const form = document.querySelector("#message-form");
// by convention use $ in front of the name

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $messages = document.querySelector("#messages");
const $sideBar = document.querySelector('#sideBar')

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// socket.on('countUpdated', (count) => {
//     console.log('Count was updated ', count)
// })

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Button was clicked!')
//     socket.emit('increment')
// })

// Options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
  // Get the New messsage element
  const $newMessage = $messages.lastElementChild

  // height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  
  // visible height

  const visibleHeight = $messages.offsetHeight

  // Height of messages container
  const containerHeight = $messages.scrollHeight

  // How far have I scroolled ?
  const scrollOffset = $messages.scrollTop + visibleHeight;
  

  if(containerHeight - newMessageHeight <= scrollOffset) {
      $messages.scrollTop = $messages.scrollHeight
  }
} 

socket.on("message", (msg) => {
  console.log(msg);
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    message: msg.text,
    createdAt: moment(msg.createdAt).format("h:m a"),
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (location) => {
  console.log('username', location.username)
  const html = Mustache.render(locationTemplate, {
    username: location.username,
    locationUrl: location.url,
    createdAt: moment(location.createdAt).format("h:m a"),
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on('roomData', ({room, users}) => {

  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  })

  $sideBar.innerHTML = html;

})

//////////////////////////
$messageForm.addEventListener("submit", (event) => {
  event.preventDefault();

  $messageFormButton.setAttribute("disabled", "disabled");

  // const msg = document.querySelector('input').value;
  const msg = event.target.elements.message.value; // message is a name for the input inside the form

  // send event message
  //   socket.emit("sendMessage", msg);

  // event acknowledgement
  socket.emit("sendMessage", msg, (error) => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log("The message was delivered!");
  });
});

const $sendLocationButton = document.querySelector("#send-location");

$sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    const location = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };

    socket.emit("sendLocation", location, () => {
      console.log(`Location was shared`);
      // just to can see the change
      setTimeout(() => {
        $sendLocationButton.removeAttribute("disabled");
      }, 2000);
    });
  });
});

socket.emit('join', {username, room}, (error) => {
  if(error) {
    alert(error)
    location.href = '/' // send the user to the main page
  }
})

