# ACC – Avanthi Cricket Carnival: Auction Website Working Document

Avanthi Institute of Engineering – College Cricket Auction Website

Idhi website yokka full plan: Home page nundi Start Auction page varaku prathi page ela undali, prathi button ela work avvali, pages ela link avvali. (Nee sketches + nee cheppina working base chesukoni ordered ga rasanu.) Website mobile and big screen rendu chotla work avvali (responsive).

---

## 1. Website Overview

**Pages (total 11 screens):**

1. Home Page
2. Player Register Page (+ Register Form)
3. Budget Verifier Page
4. View Players Page
5. View Team Page
6. Watch Live Page
7. Admin Login (floating form)
8. Admin Dashboard (3 buttons)
9. Assign Team and Add Captain Page
10. Manage Players Page
11. Start Auction Page (+ Team Updates)

**Data flow (short ga):**

- Player Register form → player data save avvuthundi (status = *Not Paid* by default)
- Budget Verifier → player status *Paid / Not Paid* update chestadu
- *Paid* players matrame → View Players, Manage Players, Auction lo kanipistaru
- Admin → Assign Team page lo teams, captains, coordinators add chestadu → View Team page, Start Auction page lo teams kanipistayi
- Start Auction lo player sold ayite → aa team card View Team page lo update avvuthundi
- Watch Live → auction lo jarige pani anni read-only ga chupistundi

---

## 2. Home Page

**Layout (sketch prakaram):**

- Paina top bar. Left top corner lo **Avanthi Institute of Engineering college logo** (nenu website ready ayyaka logo ni edit/replace chesukuntanu – anduke logo easy ga marchagalige place lo undali).
- Logo pakkana **6 buttons**: Player Register, Budget Verifier, View Players, View Team, Watch Live, Admin Login.
- Top bar kindana main area: **ACC (Avanthi Cricket Carnival) logo** tho futuristic design display avvali.
- Ee first page lo logos + buttons matrame untayi. Extra emi undadu.

**Button links:**

| Button | Ekkadiki vellali |
| --- | --- |
| Player Register | Player Register Page |
| Budget Verifier | Budget Verifier Page |
| View Players | View Players Page |
| View Team | View Team Page |
| Watch Live | Watch Live Page |
| Admin Login | Floating login form (same page meedha open avuthundi) |

**Mobile lo:** 6 buttons menu / grid laga marali, logo top lo undali.

---

## 3. Player Register Page

**Page design:**

- Background lo **cricket related animations** (bat, ball, stumps etc.).
- Aa animation paina **"Register Here"** ane **floating button**.
- Aa button click chesaka **Register Form** open avvali.

### 3.1 Register Form

| Field | Type | Rules |
| --- | --- | --- |
| Roll Number | Text input | Mandatory |
| Mobile Number | Text input | Mandatory |
| Name | Text input | Mandatory |
| Photograph URL | Text input | Mandatory |
| Course | Select (empty box) | BTech, Diploma, MBA, MCA, MTech |
| Branch | Select (empty box) | Course meedha depend avvuthundi (kindha chudu) |
| Year | Select (empty box) | 1st, 2nd, 3rd, 4th |
| CricHeroes App Profile URL | Text input | **Optional** (migathavi anni mandatory) |
| Base Price | Text input | Allowed values matrame: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 230, 250 |
| Skills | Select options | Kindha rules chudu |

**Course → Branch rule:**

- BTech → CSE, CSM, CSD, ECE, EEE, MECH
- Diploma → CM, EC, EE, M
- MCA, MBA, MTech → various branches (final branch list nuvvu ivvali; ready ayyevaraku course ki tagina branches add chestanu)

**Skills rules (Batting / Bowling / All-rounder):**

Iee moodu lo player okati matrame select cheyagalaru:

- Batting select chestee → Bowling & All-rounder disable avvali. Batting lo specific skill select cheyali: *Strike Rotator / Aggressive Batter / Big Hitter*.
- Bowling select chestee → Batting & All-rounder disable avvali. Bowling lo specific type select cheyali: *Fast / Spin*.
- All-rounder select chestee → Batting & Bowling disable avvali.
- **Wicket Keeper** separate option: Batting, Bowling leda All-rounder tho patu kalipi select cheyochu.

**Register button:**

- Anni mandatory fields fill chesaka matrame Register button work avvali. Fill cheyyakapote error chupinchali.
- Click chesaka player data database lo save avvuthundi, status = **Not Paid**.
- Ee data next ela use avvuthundi: **Budget Verifier page** lo aa player kanipistadu (course, year, branch wise list lo).

---

## 4. Budget Verifier Page

**Purpose:** Register fee offline lo teesukuntaru. Evaru amount iccharo valla status ni budget verifier update chestadu.

**Page flow (sketch prakaram):**

1. **Level 1 – Course selection:** BTech Students, Diploma Students, MCA, MBA, MTech ane buttons.
2. **Level 2 – Year selection (BTech/Diploma kosam):** 1st Year, 2nd Year, 3rd Year, 4th Year buttons. (BTech lo branch wise list: CSE, CSM, CSD, ECE, EEE, MECH. Diploma lo: CM, EC, EE, M.)
3. **Level 3 – Student list:** Aa course + year + branch lo register ayina players list. Prathi player daggara:
   - Player name (and roll number)
   - **Paid** button
   - **Not Paid** button
   - **Status** (Paid leda Not Paid ani chupistundi)

**Working:**

- *Paid* click → status "Paid" ani chupinchali.
- *Not Paid* click → status "Not Paid" ani chupinchali.
- **Paid status unna players matrame auction loki allow avvali.** Not Paid players View Players, Manage Players, Auction ekkada kanipinchakudadu.

---

## 5. View Players Page

- Budget Verifier lo **Paid** ani vachina players andharini ikkada **alphabetical order** lo display cheyali.
- Sketch prakaram prathi player ki: name, course and year, skill (batting / bowling / wicket keeper).
- Idhi only information page (edit options levu). Entha mandhi players unnaro ee page lo telustundi.

---

## 6. View Team Page

- **11 teams = 11 cards**.
- Prathi card lo:
  1. Team name (starting lo)
  2. **Captain** photo + captain name
  3. **Coordinator** photo + coordinator name
  4. Heading: **"Team Players"**
  5. Aa team captain auction lo konna players list. Prathi player ki **course and year** matrame (branch avasaram ledu, endukante prathi team BTech 1st year nundi 2, 2nd 2, 3rd 2, 4th 2, Diploma 2 pakka konali).
- Sketch lo laage: BTech – 1st year → 1. name 2. name; Diploma → 1. name 2. name; MBA → name.
- **Data ekkadi nundi:** Team name, captain, coordinator, photos anni **Admin → Assign Team and Add Captain** page nundi vastayi. Konna players **Start Auction** lo sold ayina taruvatha automatic ga ikkada add avvutaru.

---

## 7. Watch Live Page

(Idhi nee sketch lo undi, home page lo button kuda undi.)

- Live auction bidding web users andharu chudagalagali.
- **Read-only:** emi edit cheyyalekapovali.
- Start Auction page lo ippudu jarugutunna vishayalu (current player, timer, current price, leading team, sold/unsold) live ga chupinchali.

---

## 8. Admin Login

- Home page lo **Admin Login** click chesthe **floating form** open avvali.
- Fields: **Username**, **Password**.
- Username/password code lo secret ga assign chesi untayi (screen meedha ekkada kanipinchavu).
- Correct ayite → **Admin Dashboard** open avvali. Wrong ayite error message.

### 8.1 Admin Dashboard

Moodu buttons matrame:

| Button | Ekkadiki |
| --- | --- |
| Assign Team and Add Captain | Assign Team page |
| Start Auction | Start Auction page |
| Manage Players | Manage Players page |

---

## 9. Assign Team and Add Captain Page

**Form fields (sketch prakaram):**

- Team Name
- Captain Name
- Captain Photo URL
- Team Coordinator Name
- Coordinator Photo URL
- **Add** button

**Working:**

- Add click chesaka aa details tho okko team ki okko card create avvali (total 11 teams).
- Ee data ippudu ila connect avuthundi:
  - **View Team page** lo team card (name, captain + photo, coordinator + photo).
  - **Start Auction page** lo 11 team buttons (team names).
  - Team purse (1000) and players count (0/15) ikkadi nundi start avvutayi.

---

## 10. Manage Players Page

- Budget Verifier lo **Paid** ayina prathi okkaru **alphabetical order** lo display avvali.
- Prathi player pakkana **2 buttons**:
  1. **Remove** – click chesthe aa player website nundi **permanent ga delete** ayipovali.
  2. **Edit Base Price** – click chesi kotha price enter chesi OK chesthe base price update avvali.
- **Endhuku:** Player pettina base price ki sold avvakapothe, base price taggichi malli auction loki teesukostaru. Edit chesina kotha base price auction lo display avvali.

---

## 11. Start Auction Page (Main Page)

### 11.1 Layout (sketch prakaram)

- **Center:** Round **Timer** (20 sec).
- **Timer paina:** **Player Profile** card – photo, skill (Strike Rotator / Aggressive Batter / Big Hitter / Fast / Spin / All-rounder / Wicket Keeper), player register ayinappudu ichina details.
- **Timer kindana:** **Base Price** (player register lo ichina base price; bidding start ayaka current price chupistundi).
- **Timer left side:** **Select Player** dropdown. Options: BTech 1st Year, BTech 2nd Year, BTech 3rd Year, BTech 4th Year, Diploma, MCA, MBA, MTech.
- **Dropdown kindana:** **Next Player** and **Pass** buttons.
- **Timer right side:** **Teams** – 11 team name buttons (admin assign chesina team names).
- **Top right corner:** **Team Updates** button.
- **Start** button: timer daggara.

### 11.2 Auction rules (maa college rules)

Admin big screen meedha auction present chestadu. Captains andharu assemble ayyi untaru, hand raise chestaru, admin aa team button click chestadu.

### 11.3 Working step by step

1. **Year select:** Admin dropdown lo oka year/course select chestadu (e.g., BTech 1st Year).
2. **Random player:** Edi select chesinaa aa course/year lo *Paid* ayina, inka sold kani players lo nundi **random ga oka player** automatic ga display avvali (photo, skill, base price). Etuvanti extra action avasaram ledu.
3. **Start:** Admin **Start** click chesthe **20 sec timer** 20 → 0 run avvali.
4. **Bid:** Timer run avuthunnappudu oka captain hand raise chesthe, admin aa team name button click chestadu. Appudu:
   - Player price **increase** avvali (rule kindha).
   - Timer malli **20 sec ki reset** avvali.
   - Leading team = last click chesina team.
5. **Inko bid:** Inko captain hand raise chesthe, admin aa team click chestadu → price malli increase, timer reset.
6. **Sold:** 20 sec lopu evaru bid cheyyakapothe, **last bid esina team ki player sold**. Price aa team purse nundi minus avvali, player aa team lo add avvali.
7. **Reset:** Sold ayyaka screen starting stage ki vachi, **Start** button malli kanipinchali.
8. **Next Player:** Admin click chesthe same year lo inko random player display avvali.
9. **Pass:** Player evvariki vaddu anukunte admin **Pass** click chestadu → aa player skip ayyi inko player vastadu (aa player sold avvadu).
10. **No players left:** Aa year lo andharu ayipothe (sold ayyaru leda pass ayyaru) **"No players left"** ani inform cheyali. Taruvata admin next year select chesi auction continue chestadu.
11. inkoka visayam player oka team ki sold ayina ventanee congratulation player name icchi sold to ani team name thoo display chey oka 2 sec aa 2 sec ayyaka stop chesey malli bidding continue cheyy.

### 11.4 Bid increment rule

| Current price | Next bid increase |
| --- | --- |
| 100 varaku (below 100) | +10 (e.g., 40 → 50 → 60 … → 100) |
| 100 nundi 200 varaku | +20 (100 → 120 → 140 …) |
| 200 dataka | +30 (200 → 230 → 260 …) |

*(Note: first bid lo base price meedha +10 add avuthundi, e.g., base 40 → first bid 50.)*

### 11.5 Team rules and bid blocking

Prathi team ki:

- **Purse = 1000 rupees**.
- Total **15 players** konali.
- Pakka ga konali: **BTech 1st – 2, BTech 2nd – 2, BTech 3rd – 2, BTech 4th – 2, Diploma – 2** (total 10 mandatory; migata 5 any course/year).

**Block rule:** Ee niyamalu datithe, admin aa team name click chesinappudu **warning chupinchi bid ni block** cheyali (price increase avvakudadu). Examples:

- Team purse sarigga ledu (increased price ki purse saripovatledu).
- Team ki already 15 players ayyaru.
- Remaining mandatory slots ki kavalsina minimum purse migalatledu (nenu assume chesina rule: prathi remaining mandatory player ki kanisam 20 purse aina migalali).
- Ikkada starting base price 20 rupees 10 kadu gurthupettukoo

### 11.6 Team Updates button (top right)

- Click chesthe prathi team ki **separate card** open avvali.
- Card lo team name kindana: **BTech 1st, BTech 2nd, BTech 3rd, BTech 4th, Diploma, Others**.
- Prathi category lo ee team konna players count (2 target).
- 2 players konesthe **green symbol ✅**, lekapothe **red symbol ❌**.
- Purse migilindi and total players (x/15) kuda chupinchochu.

### 11.7 Sold players eppudu View Team lo kanipistaru

Player sold ayinappude aa team card (View Team page) lo **Team Players** list lo player name + course + year add avvali.

---

## 12. Page Connections (Quick Map)

- **Home** → Player Register, Budget Verifier, View Players, View Team, Watch Live, Admin Login (floating form)
- **Player Register** → Register Here button → Register Form → data → Budget Verifier
- **Budget Verifier** → Paid status → View Players, Manage Players, Auction
- **Admin Login** → Admin Dashboard → Assign Team / Start Auction / Manage Players
- **Assign Team** → View Team, Auction teams
- **Manage Players** → Remove (delete everywhere) / Edit Base Price (auction lo update)
- **Start Auction** → Team Updates, View Team, Watch Live

---

## 13. Assumptions

Nee instructions lo clear ga lekapoina vishayalu nenu ila assume chesanu (marchali anukunte cheppu):

1. Watch Live page: sketch lo undi kabatti read-only live view ga petanu.
2. MBA/MCA/MTech branches: list ivvalsi untundi.
3. Bid increment: 100 varaku +10, 100–199 lo +20, 200+ lo +30.
4. Bid block rule lo "remaining mandatory players ki minimum 20 purse" assumption.
5. Pass ayina player: aa round lo malli random ga rada. Manage Players lo base price edit chesthe malli auction loki vastadu.
6. Timer ayyaka evaru bid cheyyakapothe (first bid kuda lekapothe) player unsold, Pass laage.
