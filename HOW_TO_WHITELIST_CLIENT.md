# How to Whitelist a Client - WORKING METHOD

## The Simple Truth

The whitelist is stored in a **JSON file** (`public/premium-whitelist.json`). To add a client, you edit this file and deploy.

## Important: Separate Whitelists for Each Bot

Each premium bot has its own whitelist:
- **Novagrid 2026** ($1,099) - uses `novagrid2026` array
- **Novagrid Elite** ($499) - uses `novagridElite` array

A client can be whitelisted for one bot, both bots, or neither.

## Step-by-Step Guide

### 1. Get Client's Account Number
Ask your client: "What's your Deriv account number?"

They'll give you something like:
- `CR1234567` (Real account)
- `VRTC1234567` (Demo account)

### 2. Open the Whitelist File
Open `public/premium-whitelist.json` in your code editor

### 3. Add the Client to the Appropriate Bot(s)

The file has separate arrays for each bot:

```json
{
  "novagrid2026": [
    "CR5186289",
    "VRTC90460",
    "CR1234567"  ← Add here for Novagrid 2026 access
  ],
  "novagridElite": [
    "CR5186289",
    "CR9876543"  ← Add here for Novagrid Elite access
  ],
  "lastUpdated": "2024-01-15T00:00:00Z",
  "note": "Separate whitelists for each premium bot. Add CR/VRTC numbers to the specific bot array."
}
```

**Examples:**

- **Client bought Novagrid 2026 only:** Add to `novagrid2026` array only
- **Client bought Novagrid Elite only:** Add to `novagridElite` array only
- **Client bought both bots:** Add to BOTH arrays

### 4. Save and Deploy
```bash
git add public/premium-whitelist.json
git commit -m "feat: add premium access for CR1234567" --no-verify
git push
```

### 5. Tell Your Client
Once deployed (usually takes 1-2 minutes), tell your client which bot(s) they can access:

```
✅ You're whitelisted for [Novagrid 2026 / Novagrid Elite / Both]!

To access your premium bot:
1. Go to [your website]
2. Log into Deriv with account CR1234567
3. Click on the premium bot you purchased
4. Enter password: 6776
5. Click "Unlock Bot"
```

## Example Scenarios

### Scenario 1: Client Bought Novagrid 2026 Only

**Client says:** "I bought Novagrid 2026. My account is CR9876543"

**You do:**
1. Open `public/premium-whitelist.json`
2. Add `"CR9876543"` to the `novagrid2026` array ONLY
3. Save file
4. Run: `git add . && git commit -m "feat: add CR9876543 to Novagrid 2026" --no-verify && git push`
5. Tell client they can access Novagrid 2026

### Scenario 2: Client Bought Novagrid Elite Only

**Client says:** "I bought Novagrid Elite. My account is CR1111111"

**You do:**
1. Open `public/premium-whitelist.json`
2. Add `"CR1111111"` to the `novagridElite` array ONLY
3. Save file
4. Run: `git add . && git commit -m "feat: add CR1111111 to Novagrid Elite" --no-verify && git push`
5. Tell client they can access Novagrid Elite

### Scenario 3: Client Bought Both Bots

**Client says:** "I bought both bots. My account is CR2222222"

**You do:**
1. Open `public/premium-whitelist.json`
2. Add `"CR2222222"` to BOTH `novagrid2026` AND `novagridElite` arrays
3. Save file
4. Run: `git add . && git commit -m "feat: add CR2222222 to both premium bots" --no-verify && git push`
5. Tell client they can access both bots

## To Remove a Client

### Remove from One Bot
1. Open `public/premium-whitelist.json`
2. Remove their account number from the specific bot's array
3. Save and deploy

### Remove from All Bots
1. Open `public/premium-whitelist.json`
2. Remove their account number from ALL arrays where it appears
3. Save and deploy

## Troubleshooting

### Client says "Access denied" even after whitelisting:

**Check these things:**

1. **Is the client trying to access the correct bot?**
   - If they bought Novagrid 2026, they can't access Novagrid Elite
   - If they bought Novagrid Elite, they can't access Novagrid 2026
   - Make sure they're clicking on the bot they purchased

2. **Is the account number in the correct array?**
   - Novagrid 2026 → must be in `novagrid2026` array
   - Novagrid Elite → must be in `novagridElite` array
   - Check the JSON file to confirm

3. **Is the account number correct?**
   - Must be EXACT match (case-sensitive)
   - Format: CR followed by numbers OR VRTC followed by numbers
   - No spaces, no typos

4. **Is the client logged into the correct Deriv account?**
   - They must be logged into the EXACT account you whitelisted
   - Ask them to check their account number in Deriv dashboard

5. **Has the deployment finished?**
   - Check your hosting platform (Vercel/Netlify)
   - Make sure the latest commit is deployed
   - Usually takes 1-2 minutes

6. **Did the client refresh the page?**
   - Tell them to hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

5. **Check browser console:**
   - Tell client to press F12
   - Go to Console tab
   - Look for messages about premium access
   - Should see: "Premium access check for Novagrid 2026 - Account: CR1234567: ✅ GRANTED"

### Still not working?

Ask client to:
1. Open browser console (F12)
2. Try to access premium bot
3. Send you a screenshot of the console messages

You should see something like:
```
Premium access check for Novagrid 2026 - Account: CR1234567: ✅ GRANTED
Novagrid 2026 whitelist: ["CR5186289", "VRTC90460", "CR1234567"]
```

If you see:
```
Premium access check for Novagrid 2026 - Account: CR9999999: ❌ DENIED
Novagrid 2026 whitelist: ["CR5186289", "VRTC90460", "CR1234567"]
```

This means the client is logged into account CR9999999, but you whitelisted CR1234567. They need to log into the correct account!

If you see:
```
Premium access check for Novagrid Elite - Account: CR1234567: ❌ DENIED
Novagrid Elite whitelist: ["CR5186289"]
```

This means the client is trying to access Novagrid Elite, but they're only whitelisted for Novagrid 2026. Add them to the correct bot's array!

## How It Works

```
1. Client clicks "Access" on a premium bot (e.g., Novagrid 2026)
2. Client enters password: 6776
3. System checks: Is password correct? ✅
4. System fetches: /premium-whitelist.json
5. System checks: Is client's account in the SPECIFIC bot's whitelist?
   - Gets account from localStorage: active_loginid
   - Checks the appropriate array (novagrid2026 or novagridElite)
   - Compares with that bot's whitelist
6. If BOTH password AND bot-specific whitelist match → Bot loads
7. If password correct but NOT in that bot's whitelist → "Access denied"
```

## Important Notes

- ✅ Password is: **6776** (same for all premium bots)
- ✅ Client needs BOTH password AND bot-specific whitelist
- ✅ Each bot has its own separate whitelist
- ✅ Account number must be EXACT match
- ✅ Client must be logged into the whitelisted account
- ✅ Changes take effect after deployment (1-2 minutes)
- ⚠️ No backend database needed - it's just a JSON file!

## Quick Reference

**File to edit:** `public/premium-whitelist.json`

**Format:**
```json
{
  "novagrid2026": ["CR1234567", "VRTC9876543"],
  "novagridElite": ["CR5186289", "CR1111111"],
  "lastUpdated": "2024-01-15T00:00:00Z",
  "note": "Separate whitelists for each premium bot"
}
```

**Deploy command:**
```bash
git add . && git commit -m "feat: add client to [bot name]" --no-verify && git push
```

**Password for clients:** `6776`

**Bot Names:**
- Novagrid 2026 ($1,099) → `novagrid2026` array
- Novagrid Elite ($499) → `novagridElite` array

That's it! Simple and it actually works. 😊
