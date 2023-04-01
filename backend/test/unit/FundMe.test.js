const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name) ? describe.skip:
describe ("FundMe", function(){
    let fundMe
    let deployer
    let mockV3Aggregator

    //TAKING ETH VALUE
    const sendValue = ethers.utils.parseEther("1")

    beforeEach(async () =>{
        deployer = (await getNamedAccounts()).deployer

        //GETTING ALL DEPLOYMENT TAG's USEING fixture
        await deployments.fixture(["all"])

        fundMe = await ethers.getContract("FundMe", deployer)

        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        ) 
    })

    //TESTING fund me constructor
    describe("constructor", function () {
        it("sets the aggregator addresses correctly", async () => {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", function(){
        it("Fails if you don't send enough ETH", async()=>{
            await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!")
        })

        //comparing fundede value and mapping value
        it("Updates the amount funded data structure", async()=>{
                await fundMe.fund({value : sendValue});
                const response = await fundMe.getAddressToAmountFunded(deployer)
               assert.equal(response.toString(), sendValue.toString());
        })

        it("Adds funder to array of funders", async () => {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getFunder(0)
            assert.equal(response, deployer)
        })
    })

    //TESTING withdraw FUNCTION
        describe ("withdraw", function(){
            beforeEach(async function(){
            await fundMe.fund({value : sendValue})
        })

        it("withdraws ETH from a single funder", async () => {

            //GETTING STARTING BALANCE
            const startingFundMeBalance =
                await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance =
                await fundMe.provider.getBalance(deployer)

            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait()

            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            //GETTING ENDING BALANCE
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance =
                await fundMe.provider.getBalance(deployer)

            //Comapring 
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance
                    .add(startingDeployerBalance)
                    .toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })

        //multiple funders
        it("allows us to withdraw with multiple funders", async function(){
            const accounts = await ethers.getSigners()

            for (i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )

                await fundMeConnectedContract.fund({ value: sendValue })
            }

            const startingFundMeBalance =
            await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance =
            await fundMe.provider.getBalance(deployer)

            const transactionResponse = await fundMe.cheaperWithdraw()
               
            //GETTING GAS PRICE
            const transactionReceipt = await transactionResponse.wait()
            
            //console.log(transactionReceipt);

            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const withdrawGasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )

            const endingDeployerBalance =
                await fundMe.provider.getBalance(deployer)

            assert.equal(endingFundMeBalance, 0)

            assert.equal(
                startingFundMeBalance
                    .add(startingDeployerBalance)
                    .toString(),
                endingDeployerBalance.add(withdrawGasCost).toString()
            )

            await expect(fundMe.getFunder(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(
                        accounts[i].address
                    ),
                    0
                )
            }
        })

        //owner withdraw
        it("Only allows the owner to withdraw", async function(){
            const accounts = await ethers.getSigners()
            const attacker = accounts[1];

            const attackerConnectedCotarct = await fundMe.connect(attacker);

            await expect(
                attackerConnectedCotarct.withdraw()
            ).to.be.revertedWith("FundMe__NotOwner")
        })
    })
    
})