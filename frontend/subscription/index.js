const paymentModal = document.getElementById("paymentModal");
const paymentTitle = document.getElementById("paymentTitle");
const closePayment = document.getElementById("closePayment");

for (const button of document.querySelectorAll(".payment-button")) {
  button.addEventListener("click", () => {
    paymentModal.style.display = "flex";
  });
}

function closePaymentModal() {
  paymentModal.style.display = "none";
}

closePayment.addEventListener("click", closePaymentModal);
paymentModal.addEventListener("click", (event) => {
  if (event.target === paymentModal) closePaymentModal();
});
