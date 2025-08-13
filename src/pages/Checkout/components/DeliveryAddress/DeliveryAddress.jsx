import "./DeliveryAddress.css";
import { useUserData } from "../../../../contexts/UserDataProvider.js";
import { v4 as uuid } from "uuid";

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../../../contexts/AuthProvider.js";
import { useNavigate } from "react-router-dom";

export const DeliveryAddress = () => {
  const { userDataState, dispatch, clearCartHandler } = useUserData();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSelectWalletModal, setShowSelectWalletModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showConnectingModal, setShowConnectingModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(null);
  const [fakeBalance, setFakeBalance] = useState(0);
  const [paymentTimer, setPaymentTimer] = useState(10);

  const wallets = [
    {
      name: "MetaMask",
      logo: "/assets/icons/metamask.png",
    },
    {
      name: "Coinbase",
      logo: "/assets/icons/coinbase.png",
    },
    {
      name: "WalletConnect",
      logo: "/assets/icons/walletconnect.png",
    },
  ];

  const {
    cartProducts,
    addressList,
    orderDetails: { cartItemsDiscountTotal, orderAddress },
  } = userDataState;

  const KEY_ID = "rzp_test_VAxHG0Dkcr9qc6";

  const totalAmount = cartItemsDiscountTotal;

  const navigate = useNavigate();

  const userContact = addressList?.find(
    ({ _id }) => _id === orderAddress?._id
  )?.phone;

  const { auth, setCurrentPage } = useAuth();

  const successHandler = (response) => {
    const paymentId = response.razorpay_payment_id;
    const orderId = uuid();
    const order = {
      paymentId,
      orderId,
      amountPaid: totalAmount,
      orderedProducts: [...cartProducts],
      deliveryAddress: { ...orderAddress },
    };

    dispatch({ type: "SET_ORDERS", payload: order });
    clearCartHandler(auth.token);
    setCurrentPage("orders");
    navigate("/profile/orders");
  };

  const razorpayOptions = {
    key: KEY_ID,
    currency: "INR",
    amount: Number(totalAmount) * 100,
    name: "Art Waves Unleashed",
    description: "Order for products",
    prefill: {
      name: auth.firstName,
      email: auth.email,
      contact: userContact,
    },
    notes: { address: orderAddress },
    theme: { color: "#000000" },
    handler: (response) => successHandler(response),
  };

  // ======= Old Razorpay Integration =======
  // const placeOrderHandler = () => {
  //   if (orderAddress) {
  //     const razorpayInstance = new window.Razorpay(razorpayOptions);
  //     razorpayInstance.open();
  //   } else {
  //     toast("Please select an address!");
  //   }
  // };

  const handleRetryPayment = () => {
    setShowBalanceModal(false);
    setShowWalletModal(true);
    setHasSufficientBalance(null);
  };

  const handleCancelWallet = () => {
    setShowWalletModal(false);
    // setShowCancelModal(true); // Show cancel modal
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
  };

  const handleSelectWallet = (wallet) => {
    if (selectedWallet?.name === wallet.name) {
      setSelectedWallet(null); // Unselect if already selected
    } else {
      setSelectedWallet(wallet); // Select if not selected
    }
  };

  const handlePayWithWallet = async () => {
    setShowSelectWalletModal(false);
    setShowWalletModal(false);
    setShowConnectingModal(true);

    // Simulate connecting to wallet
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setShowConnectingModal(false);

    // Simulate balance check (replace with real logic if needed)
    const simulatedBalance = Math.random();
    setFakeBalance(simulatedBalance.toFixed(4)); // Set fake balance for display

    const hasSufficientBalance = simulatedBalance > 0.1; // 50% chance
    setHasSufficientBalance(hasSufficientBalance);
    setShowBalanceModal(true);

    if (simulatedBalance) {
      // Start payment timer
      setPaymentTimer(10);
      const timerInterval = setInterval(() => {
        setPaymentTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            setShowBalanceModal(false);
            setShowProcessingModal(true);
            setTimeout(() => {
              setShowProcessingModal(false);
              const fakeResponse = {
                crypto_payment_id: "fake_crypto_tx_" + uuid(),
                razorpay_payment_id: "crypto_" + uuid(),
                wallet: selectedWallet.name,
              };
              successHandler(fakeResponse);
              setSelectedWallet(null);
            }, 1500);
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // ======= New Crypto Integration =======
  const placeOrderHandler = () => {
    if (!orderAddress) {
      toast("Please select an address!");
      return;
    }
    setShowWalletModal(true);
  };

  return (
    <div className="delivery-address-container">
      <p>Delivering To</p>

      <div className="delivery-address-description">
        <span className="name">
          Name: {userDataState.orderDetails?.orderAddress?.name}
        </span>
        <span className="address">
          Address: {orderAddress?.street}, {orderAddress?.city},{" "}
          {orderAddress?.state}, {orderAddress?.country},{" "}
          {orderAddress?.pincode}
        </span>
        <span className="contact">Contact: {orderAddress?.phone}</span>
        <div className="delivery-address-buttons">
          <button
            onClick={placeOrderHandler}
            className="place-order-btn lively-btn crypto"
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🚀 Pay with Crypto
          </button>
          <button
            onClick={() => {
              if (orderAddress) {
                const razorpayInstance = new window.Razorpay(razorpayOptions);
                razorpayInstance.open();
              } else {
                toast("Please select an address!");
              }
            }}
            className="place-order-btn lively-btn non-crypto"
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            💳 Pay with Card / UPI
          </button>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      {showWalletModal && (
        <div className="wallet-modal-overlay">
          <div className="wallet-modal">
            <h2>Connect Crypto Wallet</h2>
            <p className="wallet-desc">
              Select your wallet to proceed with payment.
            </p>

            {/* Wallet Options */}
            <div className="wallet-grid">
              {wallets.map((wallet) => (
                <div
                  key={wallet.name}
                  className={`wallet-card ${
                    selectedWallet?.name === wallet.name ? "selected" : ""
                  }`}
                  onClick={() => handleSelectWallet(wallet)}
                >
                  <img
                    src={wallet.logo}
                    alt={wallet.name}
                    className="wallet-logo"
                  />
                  <span>{wallet.name}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <button
              onClick={handlePayWithWallet}
              className="connect-btn"
              disabled={!selectedWallet}
            >
              Pay with {selectedWallet ? selectedWallet.name : "Wallet"}
            </button>
            <button onClick={handleCancelWallet} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Select Wallet Modal */}
      {showSelectWalletModal && (
        <div className="wallet-modal-overlay">
          <div className="wallet-modal">
            <h3>Select Your Crypto Wallet</h3>

            <button
              onClick={() => {
                setShowSelectWalletModal(false);
                setShowWalletModal(true);
                setSelectedWallet(null);
              }}
              className="cancel-btn"
              style={{ marginLeft: "1rem" }}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="wallet-modal-overlay">
          <div className="wallet-modal cancel">
            <div className="cancel-icon">&#128577;</div> {/* Sad face emoji */}
            <h3>Wallet Connection Cancelled</h3>
            <p>
              You have cancelled the wallet connection.
              <br />
              No payment was processed.
            </p>
            <button onClick={handleCloseCancelModal} className="connect-btn">
              OK
            </button>
          </div>
        </div>
      )}

      {showConnectingModal && (
        <div className="processing-modal-overlay">
          <div className="processing-modal">
            <img
              src={selectedWallet.logo}
              alt={selectedWallet.name}
              className="wallet-logo"
            />
            <h2>Connecting to {selectedWallet.name}...</h2>
            <div className="spinner"></div>
            <p className="processing-text">
              Please wait while we connect to your wallet.
            </p>
          </div>
        </div>
      )}

      {showProcessingModal && (
        <div className="processing-modal-overlay">
          <div className="processing-modal">
            <img
              src={selectedWallet.logo}
              alt={selectedWallet.name}
              className="wallet-logo"
            />
            <h2>Processing Crypto Payment</h2>
            <p>
              with <strong>{selectedWallet.name}</strong>
            </p>

            <div className="spinner"></div>

            <p className="processing-text">
              Please wait while we confirm your transaction...
            </p>
          </div>
        </div>
      )}

      {showBalanceModal && (
        <div className="processing-modal-overlay">
          <div className="processing-modal">
            {/* Balance Status */}
            {hasSufficientBalance ? (
              <>
                <h2 className="status-title success">Sufficient Balance</h2>
                <div className="spinner"></div>
                {/* Wallet Info Section */}
                <div className="wallet-info">
                  <img
                    src={selectedWallet.logo}
                    alt={selectedWallet.name}
                    className="wallet-logo"
                  />
                  <div>
                    <h3>{selectedWallet.name}</h3>
                    <p className="wallet-address">
                      0xa3f9c0b7d84f22a5c31f0e1e92f143ea2b78de91
                    </p>

                    <p>
                      <strong>Balance: </strong>
                      <strong style={{ color: "#00ff88" }}>
                        {fakeBalance} ETH
                      </strong>
                    </p>
                  </div>
                </div>
                <p>
                  <strong>Amount to pay: </strong>
                  <strong style={{ color: "#00ff88" }}>₹{totalAmount}</strong>
                </p>
                <p className="timer-text">
                  Confirming payment in <strong>{paymentTimer}</strong>{" "}
                  seconds...
                </p>
              </>
            ) : (
              <>
                <h2 className="status-title error">⚠️ Insufficient Balance</h2>
                <p>
                  Your wallet does not have enough funds.
                  <br />
                  Please add funds or try another wallet.
                </p>
                <button onClick={handleRetryPayment} className="retry-btn">
                  Retry with Another Wallet
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
