
const SWAP_ADDRESS = "0xb01449a6f2d4d5dF8E43149e1a5C8E858f7b4d09"; // Updated address
const SWAP_ABI = [
    "function depositMON() external payable",
    "function depositDAK(uint256 amount) external",
    "function depositYAKI(uint256 amount) external",
    "function depositWMON(uint256 amount) external",
    "function depositUSDC(uint256 amount) external",
    "function depositMAD(uint256 amount) external",
    "function swapMONForDAK(uint256 monAmount) external payable",
    "function swapMONForYAKI(uint256 monAmount) external payable",
    "function swapMONForWMON(uint256 monAmount) external payable",
    "function swapMONForUSDC(uint256 monAmount) external payable",
    "function swapMONForMAD(uint256 monAmount) external payable",
    "function swapDAKForMON(uint256 dakAmount) external",
    "function swapYAKIForMON(uint256 yakiAmount) external",
    "function swapWMONForMON(uint256 wmonAmount) external",
    "function swapUSDCForMON(uint256 usdcAmount) external",
    "function swapMADForMON(uint256 madAmount) external",
    "function getBalances(address user) external view returns (uint256 monBalance, uint256 dakBalance, uint256 yakiBalance, uint256 wmonBalance, uint256 usdcBalance, uint256 madBalance)",
    "event SwapExecuted(address indexed user, string fromToken, string toToken, uint256 fromAmount, uint256 toAmount)"
];

const DAK_ADDRESS = "0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714";
const YAKI_ADDRESS = "0xfe140e1dCe99Be9F4F15d657CD9b7BF622270C50";
const WMON_ADDRESS = "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701";
const USDC_ADDRESS = "0x5D876D73f4441D5f2438B1A3e2A51771B337F27A";
const MAD_ADDRESS = "0xC8527e96c3CB9522f6E35e95C0A28feAb8144f15";

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function decimals() external view returns (uint8)"
];

let provider, signer, contract;
let swapHistory = [];
let tokenContracts = {};

// Rates for MON to other tokens
const baseRates = {
    MON: { DAK: 10, YAKI: 20, WMON: 1, USDC: 100, MAD: 50 },
    DAK: { MON: 0.1 },
    YAKI: { MON: 0.05 },
    WMON: { MON: 1 },
    USDC: { MON: 0.01 },
    MAD: { MON: 0.02 }
};

// Function to calculate rate between any two tokens via MON
function getRate(fromToken, toToken) {
    if (fromToken === toToken) return 1;
    if (fromToken === "MON") return baseRates.MON[toToken] || 0;
    if (toToken === "MON") return baseRates[fromToken].MON || 0;

    // Calculate rate through MON (e.g., DAK -> MON -> YAKI)
    const fromToMon = baseRates[fromToken].MON || 0;
    const monToTo = baseRates.MON[toToken] || 0;
    return fromToMon * monToTo;
}

// Approve ERC20 token spending
async function approveToken(tokenSymbol, amount) {
    if (!signer || !contract) {
        throw new Error("Please connect wallet first");
    }

    const tokenContract = tokenContracts[tokenSymbol];
    if (!tokenContract) {
        throw new Error(`Token ${tokenSymbol} not supported`);
    }

    try {
        const decimals = tokenSymbol === "USDC" ? 6 : 18;
        const amountInUnits = ethers.parseUnits(amount.toString(), decimals);
        const address = await signer.getAddress();
        const allowance = await tokenContract.allowance(address, SWAP_ADDRESS);

        if (allowance < amountInUnits) {
            const tx = await tokenContract.approve(SWAP_ADDRESS, amountInUnits);
            await tx.wait();
            console.log(`Approved ${amount} ${tokenSymbol} for swapping`);
        } else {
            console.log(`${tokenSymbol} allowance already sufficient`);
        }
    } catch (error) {
        console.error(`Approval error for ${tokenSymbol}:`, error);
        throw new Error(`Failed to approve ${tokenSymbol}: ${error.message}`);
    }
}

async function connectWallet() {
    if (window.ethereum) {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.ready;
            signer = await provider.getSigner();
            contract = new ethers.Contract(SWAP_ADDRESS, SWAP_ABI, signer);

            // Initialize token contracts
            tokenContracts["DAK"] = new ethers.Contract(DAK_ADDRESS, ERC20_ABI, signer);
            tokenContracts["YAKI"] = new ethers.Contract(YAKI_ADDRESS, ERC20_ABI, signer);
            tokenContracts["WMON"] = new ethers.Contract(WMON_ADDRESS, ERC20_ABI, signer);
            tokenContracts["USDC"] = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
            tokenContracts["MAD"] = new ethers.Contract(MAD_ADDRESS, ERC20_ABI, signer);

            document.getElementById("connectButton").style.display = "none";
            document.getElementById("disconnectButton").style.display = "inline-block";
            await updateBalances();
            console.log("Connected to wallet:", await signer.getAddress());
        } catch (error) {
            console.error("Connection error:", error);
            alert("Failed to connect wallet. Ensure MetaMask is installed and unlocked. Error: " + error.message);
        }
    } else {
        alert("Please install MetaMask to connect your wallet.");
    }
}

async function disconnectWallet() {
    provider = null;
    signer = null;
    contract = null;
    document.getElementById("connectButton").style.display = "inline-block";
    document.getElementById("disconnectButton").style.display = "none";
    document.getElementById("balancesSection").style.display = "none";
    document.getElementById("monBalance").innerText = "0";
    document.getElementById("dakBalance").innerText = "0";
    document.getElementById("yakiBalance").innerText = "0";
    document.getElementById("wmonBalance").innerText = "0";
    document.getElementById("usdcBalance").innerText = "0";
    document.getElementById("madBalance").innerText = "0";
}

async function updateBalances() {
    if (!contract || !signer) return;
    try {
        const address = await signer.getAddress();
        const balances = await contract.getBalances(address);
        document.getElementById("balancesSection").style.display = "block";
        document.getElementById("monBalance").innerText = ethers.formatEther(balances.monBalance);
        document.getElementById("dakBalance").innerText = ethers.formatUnits(balances.dakBalance, 18);
        document.getElementById("yakiBalance").innerText = ethers.formatUnits(balances.yakiBalance, 18);
        document.getElementById("wmonBalance").innerText = ethers.formatUnits(balances.wmonBalance, 18);
        document.getElementById("usdcBalance").innerText = ethers.formatUnits(balances.usdcBalance, 6);
        document.getElementById("madBalance").innerText = ethers.formatUnits(balances.madBalance, 18);
    } catch (error) {
        console.error("Balance error:", error);
    }
}

function updateEstimatedAmount() {
    const fromToken = document.getElementById("fromToken").value;
    const toToken = document.getElementById("toToken").value;
    const fromAmount = document.getElementById("fromAmount").value;

    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
        document.getElementById("toAmount").value = "";
        return;
    }

    const amount = parseFloat(fromAmount);
    const rate = getRate(fromToken, toToken);
    if (rate) {
        const estimated = amount * rate;
        document.getElementById("toAmount").value = estimated.toFixed(4);
    } else {
        document.getElementById("toAmount").value = "";
    }
}

function switchTokens() {
    const fromToken = document.getElementById("fromToken");
    const toToken = document.getElementById("toToken");
    const fromAmount = document.getElementById("fromAmount").value;

    const tempToken = fromToken.value;
    fromToken.value = toToken.value;
    toToken.value = tempToken;

    updateEstimatedAmount();
}

async function swap() {
    if (!contract || !signer) {
        alert("Please connect wallet");
        return;
    }
    const fromToken = document.getElementById("fromToken").value;
    const toToken = document.getElementById("toToken").value;
    const amount = document.getElementById("fromAmount").value;

    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
        alert("Enter valid tokens and amount");
        return;
    }

    try {
        let tx;
        // Case 1: Direct swap involving MON
        if (fromToken === "MON") {
            const monAmount = ethers.parseEther(amount);
            if (toToken === "DAK") {
                tx = await contract.swapMONForDAK(monAmount, { value: monAmount });
            } else if (toToken === "YAKI") {
                tx = await contract.swapMONForYAKI(monAmount, { value: monAmount });
            } else if (toToken === "WMON") {
                tx = await contract.swapMONForWMON(monAmount, { value: monAmount });
            } else if (toToken === "USDC") {
                tx = await contract.swapMONForUSDC(monAmount, { value: monAmount });
            } else if (toToken === "MAD") {
                tx = await contract.swapMONForMAD(monAmount, { value: monAmount });
            }
        } else if (toToken === "MON") {
            let tokenAmount, decimals;
            if (fromToken === "DAK") {
                decimals = 18;
                tokenAmount = ethers.parseUnits(amount, decimals);
                await approveToken(fromToken, amount); // Add approval step
                tx = await contract.swapDAKForMON(tokenAmount);
            } else if (fromToken === "YAKI") {
                decimals = 18;
                tokenAmount = ethers.parseUnits(amount, decimals);
                await approveToken(fromToken, amount); // Add approval step
                tx = await contract.swapYAKIForMON(tokenAmount);
            } else if (fromToken === "WMON") {
                decimals = 18;
                tokenAmount = ethers.parseUnits(amount, decimals);
                await approveToken(fromToken, amount); // Add approval step
                tx = await contract.swapWMONForMON(tokenAmount);
            } else if (fromToken === "USDC") {
                decimals = 6;
                tokenAmount = ethers.parseUnits(amount, decimals);
                await approveToken(fromToken, amount); // Add approval step
                tx = await contract.swapUSDCForMON(tokenAmount);
            } else if (fromToken === "MAD") {
                decimals = 18;
                tokenAmount = ethers.parseUnits(amount, decimals);
                await approveToken(fromToken, amount); // Add approval step
                tx = await contract.swapMADForMON(tokenAmount);
            }
        } else {
            // Case 2: Swap between non-MON tokens (e.g., DAK -> YAKI)
            // Step 1: Swap fromToken to MON
            let tokenAmount, decimals;
            let monAmount;
            if (fromToken === "DAK") {
                decimals = 18;
                tokenAmount = ethers.parseUnits(amount, decimals);
                await approveToken(fromToken, amount); // Add approval step
                tx = await contract.swapDAKForMON(tokenAmount);
                await tx.wait();
                monAmount = ethers.parseEther((parseFloat(amount) * getRate("DAK", "MON")).toString());
            } else if (fromToken === "YAKI") {
                decimals = 18;
                tokenAmount = ethers.parseUnits(amount, decimals);
                await approveToken(fromToken, amount); // Add approval step
                tx = await contract.swapYAKIForMON(tokenAmount);
                await tx.wait();
                monAmount = ethers.parseEther((parseFloat(amount) * getRate("YAKI", "MON")).toString());
            } else if (fromToken === "WMON") {
                decimals = 18;
                tokenAmount = ethers.parseUnits(amount, decimals);
                await approveToken(fromToken, amount); // Add approval step
                tx = await contract.swapWMONForMON(tokenAmount);
                await tx.wait();
                monAmount = ethers.parseEther((parseFloat(amount) * getRate("WMON", "MON")).toString());
            } else if (fromToken === "USDC") {
                decimals = 6;
                tokenAmount = ethers.parseUnits(amount, decimals);
                await approveToken(fromToken, amount); // Add approval step
                tx = await contract.swapUSDCForMON(tokenAmount);
                await tx.wait();
                monAmount = ethers.parseEther((parseFloat(amount) * getRate("USDC", "MON")).toString());
            } else if (fromToken === "MAD") {
                decimals = 18;
                tokenAmount = ethers.parseUnits(amount, decimals);
                await approveToken(fromToken, amount); // Add approval step
                tx = await contract.swapMADForMON(tokenAmount);
                await tx.wait();
                monAmount = ethers.parseEther((parseFloat(amount) * getRate("MAD", "MON")).toString());
            }

            // Step 2: Swap MON to toToken
            if (toToken === "DAK") {
                tx = await contract.swapMONForDAK(monAmount, { value: monAmount });
            } else if (toToken === "YAKI") {
                tx = await contract.swapMONForYAKI(monAmount, { value: monAmount });
            } else if (toToken === "WMON") {
                tx = await contract.swapMONForWMON(monAmount, { value: monAmount });
            } else if (toToken === "USDC") {
                tx = await contract.swapMONForUSDC(monAmount, { value: monAmount });
            } else if (toToken === "MAD") {
                tx = await contract.swapMONForMAD(monAmount, { value: monAmount });
            }
        }

        await tx.wait();
        alert("Swap successful!");
        swapHistory.push({
            fromToken,
            toToken,
            fromAmount: amount,
            toAmount: document.getElementById("toAmount").value,
            timestamp: new Date().toLocaleString()
        });
        updateHistory();
        await updateBalances();
        document.getElementById("fromAmount").value = "";
        document.getElementById("toAmount").value = "";
    } catch (error) {
        console.error("Swap error:", error);
        alert("Swap failed: " + (error.message || error.reason || "Unknown error"));
    }
}

function updateHistory() {
    const historyList = document.getElementById("historyList");
    if (swapHistory.length === 0) {
        historyList.innerHTML = "<p>No swap history yet.</p>";
        return;
    }
    historyList.innerHTML = swapHistory.map(swap => `
        <div class="history-item">
            <p>Swapped ${swap.fromAmount} ${swap.fromToken} for ${swap.toAmount} ${swap.toToken}</p>
            <p class="timestamp">${swap.timestamp}</p>
        </div>
    `).join("");
}

document.getElementById("swapTab").addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.getElementById("swapTab").classList.add("active");
    document.querySelectorAll(".section").forEach(section => section.classList.remove("active"));
    document.getElementById("swapSection").classList.add("active");
});

document.getElementById("exploreTab").addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.getElementById("exploreTab").classList.add("active");
    document.querySelectorAll(".section").forEach(section => section.classList.remove("active"));
    document.getElementById("exploreSection").classList.add("active");
});

document.getElementById("historyTab").addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.getElementById("historyTab").classList.add("active");
    document.querySelectorAll(".section").forEach(section => section.classList.remove("active"));
    document.getElementById("historySection").classList.add("active");
});

document.getElementById("connectButton").addEventListener("click", connectWallet);
document.getElementById("disconnectButton").addEventListener("click", disconnectWallet);
document.getElementById("swapButton").addEventListener("click", swap);
document.getElementById("swapArrow").addEventListener("click", switchTokens);
document.getElementById("fromAmount").addEventListener("input", updateEstimatedAmount);
document.getElementById("fromToken").addEventListener("change", updateEstimatedAmount);
document.getElementById("toToken").addEventListener("change", updateEstimatedAmount);

window.addEventListener("load", async () => {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error("Auto-connect error:", error);
        }
    }
});
