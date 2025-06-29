function toggleRole() {
  const roleText = document.getElementById('roleText');
  const roleInput = document.getElementById('roleInput');
  const isClient = document.getElementById('roleToggle').checked;

  if (isClient) {
    roleText.textContent = "Client";
    roleInput.value = "client";
  } else {
    roleText.textContent = "Provider";
    roleInput.value = "provider";
  }
}
