import { ethers } from "./ethers-5.6.esm.min.js"

const connectButton = document.getElementById("connectbutton")
const fundButton = document.getElementById("fundbutton")

connectButton.onclick = connect
fundButton.onclick = fund

console.log(ethers);

async function connect() {
    if (typeof window.ethereum !== "undefined") {
      try {
        await ethereum.request({ method: "eth_requestAccounts" })
      } catch (error) {
        console.log(error)
      }
      connectButton.innerHTML = "Connected"
      const accounts = await ethereum.request({ method: "eth_accounts" })
      console.log(accounts)
    } else {
      connectButton.innerHTML = "Please install MetaMask"
    }
  }
  

  async function fund(){
    // console.log(`Funding with ${ethAmount} .....`)
    if (typeof window.ethereum !== "undefined"){
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()

      console.log(signer);
    }
  }