// Login
const textBoxPhoneNumber = document.getElementById('tel-box')
const buttonBoxPhoneNumber = document.getElementById('tel-button')
const legendForLogin = document.getElementById('warning-text-login')
const alerttatusRegistration = document.getElementById('alert-status-login')
const messageStatusRegistration = document.getElementById('alert-status-login-message')
const iconStatusRegistration = document.getElementById('alert-status-login-image')
const registrationForm = document.getElementById('container-registration-number')
// dashboard
const headerDashboard = document.getElementById('div-header')
const dashboardContacts = document.getElementById('div-content')
const contentListContacts = document.getElementById('contacts')
const addNewContactButton = document.getElementById('add-contact')
const newContactName = document.getElementById('name')
const newContactPhone = document.getElementById('phone')
const newContactButton = document.getElementById('save-contact')
const newContactClose = document.getElementById('close')
const newContactModel = document.getElementById('add-new-contact-modal')
const cancelCall = document.getElementById('cancel-call-progress')
let nameContactCalling = document.getElementById('id-name-contact')
const attemptingCalling = document.getElementById('attempting-to-call')
const cameraContainer = document.getElementById('camera-container')
const camera = document.getElementById('camera-hablando')
// call in progress}
const callingToMessage = document.getElementById('attempting-to-call')
const hungUpButton = document.getElementById('button-hungup')
var connectionPeerToPeer = {}
var connectionTransferData = ''
var soundcalling = ''
var soundcallingIn = ''

checkIfNumberIsRegisteredLocally()
async function checkIfNumberIsRegisteredLocally() {
    if(localStorage.getItem('phone_id_hablando') != undefined && localStorage.getItem('phone_id_hablando') != '') {
        const number = localStorage.getItem('phone_id_hablando')
        const response = await validateNumber(number)
        if(response.status) {
            renderContactsOnDashboard()
            headerDashboard.style.display = 'block'
            dashboardContacts.style.display = 'block'
            registrationForm.style.display = 'none'
            await startConnectionPeer()
        }else {
            registrationForm.style.display = 'block'
        }
    }else {
        registrationForm.style.display = 'block' 
    }
}
async function requestSTUNServers() {
    try {
        const data = await fetch('https://servers-gamma.vercel.app/')
        return await data.json()
    } catch (err) {
        return alert("Error ocurred: ", err)
    }
}
async function startConnectionPeer() {
    let contactCalling = ''
    const servers = await requestSTUNServers()
    connectionPeerToPeer = new Peer({config:{'iceServers': servers}})
    connectionPeerToPeer.on('open', async (id) => {
        localStorage.setItem('hash_peer_hablando', id)
        const phone = localStorage.getItem('phone_id_hablando')
        const hash = localStorage.getItem('hash_peer_hablando')
        const updateHash = await updateIDHash(phone, hash)
        console.log(updateHash)
        connectionEstablishedWithServer()
    })
    connectionPeerToPeer.on('connection', (conn)=> {
        connectionTransferData = conn
        connectionTransferData.on('open', ()=> {
            connectionTransferData.on('data', (data)=> {
                if(data == 'CANCEL_CALL_IN_PROGRESS') {
                    cancelRejectCallFromReceiver()
                    stopSoundIn()
                }else {
                    const contacts = JSON.parse(getAllContacts())
                    contactCalling = getContactWhosCalling(contacts, data)
                }
            })
        })
    })
    connectionPeerToPeer.on('call', async function(call) {
        const streamForCameraAndAudio = await requestAndGetCameraAndAudio()
        const buttonPickup = inboundCall()
        soundcallingIn = inboundCallSound()
        soundcallingIn.play()
        nameContactCalling.textContent = `${contactCalling} llamando...`
        buttonPickup.onclick = () => {
            call.answer(streamForCameraAndAudio)
            stopSoundIn()
            call.on('stream', function(stream) {
                attemptingCalling.style.display = 'none'
                camera.srcObject = stream

            })
        }
        hungUpButton.onclick = () => {
            call.close()
        }
        call.on('close', ()=> {
            cameraContainer.style.display = 'none'
            window.location.reload();
        })
    });
    connectionPeerToPeer.on('error', (error) => {
        const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 4000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            },
          });
        cancelRejectCallFromReceiver()
        console.log(error.type)
        if(error.type == 'peer-unavailable') {
              Toast.fire({
                icon: "error",
                title: `Lo sentimos, el contacto no está conectada`
              });
        } else {
            Toast.fire({
                icon: "error",
                title: error.type
            });
        }
    })
}
async function updateIDHash(phone, hash) {
    //http://localhost/hablando.top/
    try {
        const data = await fetch('/hablando.top/hablando.php/update_hash', { method: 'POST', body: JSON.stringify({ phone, hash }) })
        return await data.json()
    } catch (error) {
        return alert(error)
    }
}
async function getIDHash(phone) {
    try {
        const data = await fetch('/hablando.top/hablando.php/get_hash', { method: 'POST', body: JSON.stringify({ phone }) })
        return await data.json()
    } catch (error) {
        return alert(error)
    }
}
addNewContactButton.onclick = () => openModalNewContact()
newContactClose.onclick = () => closeModalNewContact()
buttonBoxPhoneNumber.onclick = async () => {
    const number = textBoxPhoneNumber.value
    if (number.length == 10 && AreAllNumbers(number)) {
        stopButton()
        registrationInProgress()
        const response = await validateNumber(number)
        if(response.status) {
            localStorage.setItem('phone_id_hablando', number)
            phoneNumberValid()
            hideAlertStatus()
            setTimeout(() => {
                headerDashboard.style.display = 'block'
                dashboardContacts.style.display = 'block'
                registrationForm.style.display = 'none'
                startConnectionPeer()
            }, 3000);
        }else {
            phoneNumberNotValid()
            hideAlertStatus()
        }
        startButton()
    } else {
        notCorrectNumberShow()
        stopButton()
        setInterval(() => {
            notCorrectNumberHide()
            startButton()
        }, 2000)
    }
}

newContactButton.onclick = () => {
    const name = newContactName.value
    const phone = newContactPhone.value
    if (name.length >= 3 && phone.length == 10 && AreAllNumbers(phone)) {
        const dataContact = { name, phone }
        saveContact(dataContact)
    } else if (name.length < 3 && phone.length == 0 || name.length < 3 && !AreAllNumbers(phone)) {
        incorrectDataContact()
    } else if (!AreAllNumbers(phone) || phone.length < 10) {
        newContactPhone.classList.add('red-alert-boxes')
        setTimeout(() => { newContactPhone.classList.remove('red-alert-boxes') }, 500)
    } else if (name.length < 3) {
        newContactName.classList.add('red-alert-boxes')
        setTimeout(() => { newContactName.classList.remove('red-alert-boxes') }, 500)
    } else {
        incorrectDataContact()
    }
}
function connectionEstablishedWithServer() {
    headerDashboard.style.backgroundColor = '#0381ff'
    document.getElementById('id-set-up').innerText = localStorage.getItem('phone_id_hablando')   
}
function incorrectDataContact() {
    newContactName.classList.add('red-alert-boxes')
    newContactPhone.classList.add('red-alert-boxes')
    setTimeout(() => {
        newContactName.classList.remove('red-alert-boxes')
        newContactPhone.classList.remove('red-alert-boxes')
    }, 500)
}
function saveContact(dataContact) {
    let index = 0
    if (contactListExists()) {
        const contacts = getAllContacts()
        const contactsList = JSON.parse(contacts)
        contactsList.push(dataContact)
        localStorage.setItem('user_contact_list_hablando', JSON.stringify(contactsList))
        index = contactsList.length - 1
    } else {
        // saves a contact in an array
        localStorage.setItem('user_contact_list_hablando', JSON.stringify([dataContact]))
    }
    contactsCardCreate(dataContact.name, dataContact.phone, index)
    newContactName.value = ''
    newContactPhone.value = ''
    closeModalNewContact()

}
function deleteContact(indexContact) {
    const contacts = JSON.parse(getAllContacts())
    contacts.splice(indexContact, 1)
    localStorage.setItem('user_contact_list_hablando', JSON.stringify(contacts))
    removeDashboard()
    renderContactsOnDashboard()
}
function removeDashboard() {
    while (contentListContacts.firstChild) {
        contentListContacts.removeChild(contentListContacts.firstChild)
    }
}
function contactListExists() {
    return localStorage.getItem('user_contact_list_hablando') ? true : false
}
function renderContactsOnDashboard() {
    if (contactListExists()) {
        const contacts = JSON.parse(getAllContacts())
        for (var i = 0; i < contacts.length; i++) {
            contactsCardCreate(contacts[i].name, contacts[i].phone, i)
        }
    }
}
function getAllContacts() {
    return localStorage.getItem('user_contact_list_hablando')
}
function AreAllNumbers(number) {
    for (var i = 0; i < number.length; i++) {
        if (isNaN(parseInt(number[i]))) {
            return false;
        }
    }
    return true;
}
async function validateNumber(number) {
    try {
        const data = await fetch('/hablando.top/hablando.php/register', { method: 'POST', body: JSON.stringify({ number }) })
        return await data.json()
    } catch (err) {
        return alert(err)
    }
}
function notCorrectNumberShow() {
    legendForLogin.style.display = 'block'
    legendForLogin.innerText = '* Valor incorrecto!'
}
function notCorrectNumberHide() {
    legendForLogin.style.display = 'none'
    legendForLogin.innerText = ''
}
function getContactWhosCalling(contacts, contact) {
    let person = 'Alguien '
    for(var i =0; i < contacts.length; i++) {
        if(contacts[i].phone == contact) {
            person = contacts[i].name
            break
        }
    }
    return person
}
function contactsCardCreate(name, phone, indexContact) {

    const contactCardDiv = document.createElement('div');
    contactCardDiv.classList.add('contact-card');

    const contactNameDiv = document.createElement('div');
    contactNameDiv.classList.add('contact-name');

    const contactNameH2 = document.createElement('h2');
    contactNameH2.setAttribute('id', 'contact-name');
    contactNameH2.textContent = name;

    const deleteContactButton = document.createElement('button');
    deleteContactButton.setAttribute('id', 'delete-contact');

    const trashIcon = document.createElement('i');
    trashIcon.classList.add('fas', 'fa-trash');
    trashIcon.onclick = () => deleteContact(indexContact)

    deleteContactButton.appendChild(trashIcon);

    contactNameDiv.appendChild(contactNameH2);
    contactNameDiv.appendChild(deleteContactButton);

    const contactInfoDiv = document.createElement('div');
    contactInfoDiv.classList.add('contact-info');

    const userIconDiv = document.createElement('div');
    userIconDiv.classList.add('user-icon');

    const userIcon = document.createElement('i');
    userIcon.classList.add('fas', 'fa-user');

    const phoneNumberH3 = document.createElement('h3');
    phoneNumberH3.textContent = phone;

    userIconDiv.appendChild(userIcon);
    userIconDiv.appendChild(phoneNumberH3);

    const callButtonDiv = document.createElement('div');
    callButtonDiv.classList.add('call-button-div');

    const startCallButton = document.createElement('button');
    startCallButton.setAttribute('id', 'button-start-call');
    startCallButton.innerHTML = '<i class="fas fa-phone-alt"></i>Llamar';
    startCallButton.onclick = () => callPerson(name, phone)

    callButtonDiv.appendChild(startCallButton);

    contactCardDiv.appendChild(contactNameDiv);
    contactCardDiv.appendChild(contactInfoDiv);

    contactInfoDiv.appendChild(userIconDiv);
    contactInfoDiv.appendChild(callButtonDiv);

    contentListContacts.appendChild(contactCardDiv);
}
function registrationInProgress() {
    iconStatusRegistration.src = './public/images/load.gif'
    iconStatusRegistration.style.width = '70px'
    iconStatusRegistration.style.height = '70px'
    iconStatusRegistration.style.position = 'absolute'
    iconStatusRegistration.style.right = '0px'
    iconStatusRegistration.style.top = '-15px'
    alerttatusRegistration.style.backgroundColor = 'rgb(255, 169, 41)'
    messageStatusRegistration.innerText = 'procesando...'
    execAlert()
}
function phoneNumberValid() {
    iconStatusRegistration.src = './public/images/accepted.gif'
    iconStatusRegistration.style.width = '45px'
    iconStatusRegistration.style.height = '45px'
    iconStatusRegistration.style.position = 'absolute'
    iconStatusRegistration.style.right = '0px'
    iconStatusRegistration.style.top = '-2px'
    alerttatusRegistration.style.backgroundColor = 'rgb(0, 197, 0)'
    messageStatusRegistration.innerText = 'registro exitoso'
    execAlert()
}
function phoneNumberNotValid() {
    iconStatusRegistration.src = './public/images/rejected.gif'
    iconStatusRegistration.style.width = '45px'
    iconStatusRegistration.style.height = '45px'
    iconStatusRegistration.style.position = 'absolute'
    iconStatusRegistration.style.right = '0px'
    iconStatusRegistration.style.top = '-2px'
    alerttatusRegistration.style.backgroundColor = 'red'
    messageStatusRegistration.innerText = 'Número no válido'
    execAlert()
}
function showAlertStatus() {
    setTimeout(() => alerttatusRegistration.style.top = '0px', 100)
}
function hideAlertStatus() {
    setTimeout(() => alerttatusRegistration.style.top = '-200px', 3000)
}
function execAlert() {
    showAlertStatus()
}
function closeModalNewContact() {
    newContactModel.style.display = 'none'
}
function openModalNewContact() {
    newContactModel.style.display = 'block'
}
async function callPerson(name, phone) {
    const streamForCameraAndAudio = await requestAndGetCameraAndAudio()
    const hash = await getIDHash(phone)
    const connectionID = hash.hash
    const localContact = localStorage.getItem('phone_id_hablando')
    soundcalling = outboundCallSound()
    nameContactCalling.innerText = `Llamando a ${name}...`
    cameraContainer.style.display = 'block'
    soundcalling.play()
    connectionTransferData = connectionPeerToPeer.connect(connectionID)
    connectionTransferData.on('open', ()=> {
        connectionTransferData.on('data', (data)=> {
            if(data == 'CANCEL_CALL_IN_PROGRESS') {
                soundcalling.pause()
                soundcalling.src = null
                cancelRejectCallFromReceiver()
                stopSoundIn()
            }
        })
        connectionTransferData.send(localContact)
    })
    var call = connectionPeerToPeer.call(connectionID, streamForCameraAndAudio)
    call.on('stream', function(stream) {
        attemptingCalling.style.display = 'none'
        soundcalling.pause()
        soundcalling.src = null
        camera.srcObject = stream
    })   
    hungUpButton.onclick = () => {
        call.close()
    }
    call.on('close', ()=> {
        cameraContainer.style.display = 'none'
        window.location.reload();
    })
}
function outboundCallSound() {
    return new Audio('./public/sounds/callingoutbound.mp3')
}
function inboundCallSound() {
    return new Audio('./public/sounds/callinginbound.mp3')
}
function requestAndGetCameraAndAudio() {
    if (!navigator.mediaDevices && !navigator.mediaDevices.getUserMedia) {
        alert('Browser does not support for camera/audio')
        return
    }
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
            return stream
        })
        .catch((err) => console.error(err))
}
function inboundCall() {
    const divStatusCalling = document.getElementById('status-calling')
    const acceptCallButton = document.createElement('button')
    divStatusCalling.classList.add('inboud-call-style-container')
    divStatusCalling.classList.add('inboud-call-style-container-mobile')
    acceptCallButton.innerText = 'Aceptar'
    acceptCallButton.id = 'accept-call-progress'
    divStatusCalling.insertBefore(acceptCallButton, cancelCall)
    cameraContainer.style.display = 'block'   
    nameContactCalling.innerText = ' llamando'
    acceptCallButton.classList.add('inboud-call-style')
    cancelCall.classList.add('inboud-call-style')
    acceptCallButton.style.marginRight = '10px'
    acceptCallButton.style.backgroundColor = '#2ecc71'
    return acceptCallButton
}
function cancelRejectCallFromReceiver() {
    const divStatusCalling = document.getElementById('status-calling')
    divStatusCalling.classList.remove('inboud-call-style-container', 'inboud-call-style-container-mobile')
    cancelCall.classList.remove('inboud-call-style')
    nameContactCalling.innerText = ''
    if(divStatusCalling.children.length == 3) {
        divStatusCalling.removeChild(divStatusCalling.children[1])
    }
    cameraContainer.style.display = 'none'
    if(soundcalling != '') {
        soundcalling.pause()
        soundcalling.src = null
    }
}
function stopButton() { buttonBoxPhoneNumber.disabled = true }
function startButton() { buttonBoxPhoneNumber.disabled = false }
cancelCall.onclick = () => {
    cancelRejectCallFromReceiver()
    connectionTransferData.send('CANCEL_CALL_IN_PROGRESS')
    if(soundcalling != '') {
        soundcalling.pause()
        soundcalling.src = null
    }
    stopSoundIn()
    cameraContainer.style.display = 'none'
}
function stopSoundIn() {
    if(soundcallingIn != '') {
        soundcallingIn.pause()
        soundcallingIn.src = null
    }
}