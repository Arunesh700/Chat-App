const socket = io()
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
//template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationmessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;
//options
const {username,room} = Qs.parse(location.search,{ignoreQueryPrefix:true})
const autoscroll = () => {
  //New message elements
  const $newMessage = $messages.lastElementChild

  //Height of the new $messages
  const newMessagestyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessagestyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
  const visibleHeight = $messages.offsetHeight;
  const containerHeight = $messages.scrollHeight;
  const scrollOffset = $messages.scrollTop + visibleHeight
  if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }

}

socket.on('message',(msg) => {
  const html = Mustache.render(messageTemplate,{
    username:msg.username,
    message:msg.text,
    createdAt:moment(msg.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend',html)
  autoscroll()
})
socket.on('roomData',({room,users}) => {
  console.log(room);
  console.log(users);
  const html = Mustache.render(sidebarTemplate,{
    room,
    users
  })
  document.querySelector('#sidebar').innerHTML = html;
})
socket.on('locationMessage', (urlMsg) => {
  const html = Mustache.render(locationmessageTemplate,{
    username: urlMsg.username,
    url:urlMsg.url,
    createdAt:moment(urlMsg.createdAt).format('h:mm a')
  })
  $messages.insertAdjacentHTML('beforeend',html)
  autoscroll()
})

$messageForm.addEventListener('submit',(e) => {
  e.preventDefault();
  $messageFormButton.disabled = true

  var text = e.target.elements.message.value;
  if(text !== ''){
  socket.emit('sendMessage',text,(error) => {
    $messageFormButton.disabled = false;
    $messageFormInput.value = ''
    $messageFormInput.focus()
    $messageFormInput.setAttribute('placeholder','Type here!')
    if (error.includes('Profanity')) {
      return alert('Dont use bad words please');
    }
    console.log('Message delivered');
  });
} else {
  $messageFormInput.setAttribute('placeholder','Write Something and then send')
  $messageFormButton.disabled = false;
  $messageFormInput.focus()
}
})
$sendLocationButton.addEventListener('click',() => {
  $sendLocationButton.disabled = true
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser')
  }
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('sendLocation', {
      latitude:position.coords.latitude,
      longitude:position.coords.longitude
    },(message) => {
     $sendLocationButton.disabled = false;
      console.log(message);
    })
  })
})

socket.emit('join',{username,room},(error) => {
  if(error) {
    alert(error)
    location.href ='/'
  }
})
