# Port 0 lets the OS pick a free port; Next prints the URL it got
default:
    npm run build && npm run start -- -p 0

dev:
    npm run dev
