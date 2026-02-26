# Premium Bot Whitelist Management Guide

## Overview
The premium bot access system uses a server-side whitelist stored in `public/premium-whitelist.json`. This ensures that access control works across all devices and browsers.

## How It Works

### For Users:
1. User clicks "Access" on a premium bot
2. User enters password: **6776**
3. System checks if user's Deriv account (CR/VRTC number) is in the server whitelist
4. If both password AND whitelist match → bot loads
5. If password correct but not whitelisted → access denied

### For Admin (You):
To grant premium bot access to a client:

## Step 1: Get Client's Account Number
Ask your client for their Deriv account number. It will be in one of these formats:
- **CR1234567** (Real account)
- **VRTC1234567** (Demo account)

## Step 2: Update the Whitelist File
1. Open `public/premium-whitelist.json`
2. Add the client's account number to the `premiumAccounts` array:

```json
{
  "premiumAccounts": [
    "CR5186289",
    "VRTC90460",
    "CR7654321"  ← Add new account here
  ],
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

## Step 3: Deploy the Changes
After updating the file, you need to deploy:

```bash
git add public/premium-whitelist.json
git commit -m "feat: add premium access for CR7654321"
git push
```

Then deploy to your hosting platform (Vercel, Netlify, etc.)

## Step 4: Verify Access
1. Ask client to refresh the page
2. Client enters password 6776
3. Client should now have access to premium bots

## Viewing Current Whitelist
You can view the current whitelist in the Admin Panel:
1. Type "ADMIN" then press Enter twice
2. Click "Premium Bot Access" tab
3. See all whitelisted accounts

## Removing Access
To revoke access:
1. Open `public/premium-whitelist.json`
2. Remove the account number from the array
3. Commit and deploy changes

## Important Notes
- ✅ Changes work across ALL devices and browsers
- ✅ No need for client to be on your network
- ✅ Centralized control from one file
- ⚠️ Changes require redeployment to take effect
- ⚠️ Both password (6776) AND whitelist are required

## Example Workflow

### Adding a New Client:
```bash
# 1. Client sends you their account: CR9876543

# 2. Edit public/premium-whitelist.json
# Add "CR9876543" to the premiumAccounts array

# 3. Deploy
git add public/premium-whitelist.json
git commit -m "feat: add premium access for client CR9876543"
git push

# 4. Notify client they now have access
```

## Troubleshooting

### Client says "Access denied" even with correct password:
- Check if their account number is in `premium-whitelist.json`
- Verify the account number is spelled correctly (case-sensitive)
- Ensure changes have been deployed
- Ask client to hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### How to find client's account number:
- It's shown in their Deriv dashboard
- Format: CR followed by numbers (real) or VRTC followed by numbers (demo)
- Example: CR5186289 or VRTC90460

## File Location
```
Novaprime/
├── public/
│   └── premium-whitelist.json  ← Edit this file
```

## Security
- Password: 6776 (shared with trusted clients only)
- Whitelist: Server-side, cannot be modified by users
- Both layers required for access
