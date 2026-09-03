import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, X, Music, ChevronDown, ChevronUp, Trash2, Settings, RotateCcw,
  StickyNote, Search, Lock, Award, FolderPlus, Disc3, Pencil, Check, Users, Wrench, UserCircle, Copy, GripVertical, List, LayoutGrid, ListChecks, Download,
} from "lucide-react";

// Storage shim: the app was originally built for Claude's artifact environment,
// which provides window.storage.get/set backed by Anthropic's servers. Outside
// that environment (e.g. deployed to GitHub Pages), window.storage doesn't
// exist, so we polyfill the same interface using the browser's localStorage.
// Note: localStorage is per-browser/device, not synced across devices like
// the original Claude storage was.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(key);
      if (raw === null) throw new Error("not found");
      return { key, value: raw };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(key);
      return { key, deleted: true };
    },
    async list(prefix = "") {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
      return { keys };
    },
  };
}

const DEFAULT_THEME = { accent: "#FF3D7F", secondary: "#B8A6FF", highlight: "#FFC857", background: "#14121F" };
const CATALOG_LAST_UPDATED = "September 2, 2026";
const APP_LAST_UPDATED = "September 2, 2026";
const CARD = "#1D1A2B";
const ROW_ALT = "#221E33";
const TEXT = "#F3F0FA";
const MUTED = "#9C96B5";
const BORDER = "#35304D";
const GOLD = "#FFD966";
const SILVER = "#C9CDD6";
const BRONZE = "#D08A54";

const AWARD_EMOJIS = [
  "🏆","🥇","🥈","🥉","🎖️","👑",
  "⭐","🌙","✨","🆕","🫧","📌",
  "❤️","🩵","💛","🤍","🖤","💚",
  "🥀","🌸","🪦","🌱","💦","💋",
  "💯","🎉","🔥","⏳","❌","💎",
];
const TIER_PALETTE = ["#FF3D7F", "#FF8A5B", "#FFC857", "#B8A6FF", "#5FD9C0", "#7EC8E3"];

// Built-in searchable catalog: [title, artist, album, year]. This is the pool the
// Rank search draws from — songs only join a list when explicitly added.
const SEED_SONGS = [
  ["Like OOH-AHH", "Twice", "The Story Begins", 2015],
  ["Do It Again", "Twice", "The Story Begins", 2015],
  ["Going Crazy", "Twice", "The Story Begins", 2015],
  ["Truth", "Twice", "The Story Begins", 2015],
  ["Candy Boy", "Twice", "The Story Begins", 2015],
  ["Like a Fool", "Twice", "The Story Begins", 2015],
  ["CHEER UP", "Twice", "Page Two", 2016],
  ["Precious Love", "Twice", "Page Two", 2016],
  ["Touchdown", "Twice", "Page Two", 2016],
  ["Tuk Tok", "Twice", "Page Two", 2016],
  ["Woohoo", "Twice", "Page Two", 2016],
  ["My Headphones On", "Twice", "Page Two", 2016],
  ["I'm Going To Be a Star (CD Only)", "Twice", "Page Two", 2016],
  ["TT", "Twice", "TWICEcoaster: Lane 1", 2016],
  ["1 to 10", "Twice", "TWICEcoaster: Lane 1", 2016],
  ["Ponytail", "Twice", "TWICEcoaster: Lane 1", 2016],
  ["Jelly Jelly", "Twice", "TWICEcoaster: Lane 1", 2016],
  ["Pit-A-Pat", "Twice", "TWICEcoaster: Lane 1", 2016],
  ["Next Page", "Twice", "TWICEcoaster: Lane 1", 2016],
  ["One in a Million", "Twice", "TWICEcoaster: Lane 1", 2016],
  ["Knock Knock", "Twice", "TWICEcoaster: Lane 2", 2017],
  ["Ice Cream", "Twice", "TWICEcoaster: Lane 2", 2017],
  ["TT (Tak Remix) (CD Only)", "Twice", "TWICEcoaster: Lane 2", 2017],
  ["Like Ooh-Ahh (Instrumental) (CD Only)", "Twice", "TWICEcoaster: Lane 2", 2017],
  ["Cheer Up (Instrumental) (CD Only)", "Twice", "TWICEcoaster: Lane 2", 2017],
  ["TT (Instrumental) (CD Only)", "Twice", "TWICEcoaster: Lane 2", 2017],
  ["Signal", "Twice", "Signal", 2017],
  ["Three Times a Day", "Twice", "Signal", 2017],
  ["Only You", "Twice", "Signal", 2017],
  ["Hold Me Tight", "Twice", "Signal", 2017],
  ["Eye Eye Eyes", "Twice", "Signal", 2017],
  ["Someone Like Me", "Twice", "Signal", 2017],
  ["One More Time", "Twice", "One More Time", 2017],
  ["Luv Me", "Twice", "One More Time", 2017],
  ["Likey", "Twice", "Twicetagram", 2017],
  ["Turtle", "Twice", "Twicetagram", 2017],
  ["Missing U", "Twice", "Twicetagram", 2017],
  ["Wow", "Twice", "Twicetagram", 2017],
  ["FFW", "Twice", "Twicetagram", 2017],
  ["Ding Dong", "Twice", "Twicetagram", 2017],
  ["24/7", "Twice", "Twicetagram", 2017],
  ["Look At Me", "Twice", "Twicetagram", 2017],
  ["Rollin'", "Twice", "Twicetagram", 2017],
  ["Love Line", "Twice", "Twicetagram", 2017],
  ["Don't Give Up", "Twice", "Twicetagram", 2017],
  ["You In My Heart", "Twice", "Twicetagram", 2017],
  ["Jaljayo Good Night", "Twice", "Twicetagram", 2017],
  ["Heart Shaker", "Twice", "Merry & Happy", 2017],
  ["Merry & Happy", "Twice", "Merry & Happy", 2017],
  ["Candy Pop", "Twice", "Candy Pop", 2018],
  ["Brand New Girl", "Twice", "Candy Pop", 2018],
  ["What is Love?", "Twice", "What is Love?", 2018],
  ["Sweet Talker", "Twice", "What is Love?", 2018],
  ["Ho!", "Twice", "What is Love?", 2018],
  ["Dejavu", "Twice", "What is Love?", 2018],
  ["Say Yes", "Twice", "What is Love?", 2018],
  ["Stuck", "Twice", "What is Love?", 2018],
  ["Wake Me Up", "Twice", "Wake Me Up", 2018],
  ["Pink Lemonade", "Twice", "Wake Me Up", 2018],
  ["I Want You Back", "Twice", "I Want You Back", 2018],
  ["Dance The Night Away", "Twice", "Summer Nights", 2018],
  ["Chillax", "Twice", "Summer Nights", 2018],
  ["Shot Thru the Heart", "Twice", "Summer Nights", 2018],
  ["BDZ", "Twice", "BDZ", 2018],
  ["L.O.V.E.", "Twice", "BDZ", 2018],
  ["Wishing", "Twice", "BDZ", 2018],
  ["Say It Again", "Twice", "BDZ", 2018],
  ["Be as ONE", "Twice", "BDZ", 2018],
  ["Stay By My Side", "Twice", "Stay By My Side", 2018],
  ["YES or YES", "Twice", "YES or YES", 2018],
  ["Say You Love Me", "Twice", "YES or YES", 2018],
  ["Lalala", "Twice", "YES or YES", 2018],
  ["Young & Wild", "Twice", "YES or YES", 2018],
  ["Sunset", "Twice", "YES or YES", 2018],
  ["After Moon", "Twice", "YES or YES", 2018],
  ["The Best Thing I Ever Did", "Twice", "The Year of Yes", 2018],
  ["Swing", "Twice", "&TWICE -Repackage-", 2020],
  ["Fake & True", "Twice", "&TWICE", 2019],
  ["Stronger", "Twice", "&TWICE", 2019],
  ["Changing!", "Twice", "&TWICE", 2019],
  ["What You Waiting For", "Twice", "&TWICE", 2019],
  ["Be OK", "Twice", "&TWICE", 2019],
  ["POLISH", "Twice", "&TWICE", 2019],
  ["How u doin", "Twice", "&TWICE", 2019],
  ["The Reason Why", "Twice", "&TWICE", 2019],
  ["Fancy", "Twice", "Fancy You", 2019],
  ["Stuck in My Head", "Twice", "Fancy You", 2019],
  ["Girls Like Us", "Twice", "Fancy You", 2019],
  ["Hot", "Twice", "Fancy You", 2019],
  ["Turn it Up", "Twice", "Fancy You", 2019],
  ["Strawberry", "Twice", "Fancy You", 2019],
  ["Happy Happy", "Twice", "Happy Happy", 2019],
  ["Breakthrough", "Twice", "Breakthrough", 2019],
  ["Feel Special", "Twice", "Feel Special", 2019],
  ["Rainbow", "Twice", "Feel Special", 2019],
  ["Get Loud", "Twice", "Feel Special", 2019],
  ["Trick It", "Twice", "Feel Special", 2019],
  ["Love Foolish", "Twice", "Feel Special", 2019],
  ["21:29", "Twice", "Feel Special", 2019],
  ["More & More", "Twice", "More & More", 2020],
  ["Oxygen", "Twice", "More & More", 2020],
  ["Firework", "Twice", "More & More", 2020],
  ["Make Me Go", "Twice", "More & More", 2020],
  ["Shadow", "Twice", "More & More", 2020],
  ["Don't Call Me Again", "Twice", "More & More", 2020],
  ["Sweet Summer Day", "Twice", "More & More", 2020],
  ["Fanfare", "Twice", "Fanfare", 2020],
  ["I Can't Stop Me", "Twice", "Eyes Wide Open", 2020],
  ["Hell in Heaven", "Twice", "Eyes Wide Open", 2020],
  ["Up No More", "Twice", "Eyes Wide Open", 2020],
  ["Do What We Like", "Twice", "Eyes Wide Open", 2020],
  ["Bring It Back", "Twice", "Eyes Wide Open", 2020],
  ["Believer", "Twice", "Eyes Wide Open", 2020],
  ["Queen", "Twice", "Eyes Wide Open", 2020],
  ["Go Hard", "Twice", "Eyes Wide Open", 2020],
  ["Shot Clock", "Twice", "Eyes Wide Open", 2020],
  ["Handle It", "Twice", "Eyes Wide Open", 2020],
  ["Depend On You", "Twice", "Eyes Wide Open", 2020],
  ["Say Something", "Twice", "Eyes Wide Open", 2020],
  ["Behind The Mask", "Twice", "Eyes Wide Open", 2020],
  ["BETTER", "Twice", "BETTER", 2020],
  ["Scorpion", "Twice", "BETTER", 2020],
  ["Cry For Me", "Twice", "Cry For Me", 2020],
  ["Kura Kura", "Twice", "Kura Kura", 2021],
  ["Strawberry Moon", "Twice", "Kura Kura", 2021],
  ["Alcohol-Free", "Twice", "Taste Of Love", 2021],
  ["First Time", "Twice", "Taste Of Love", 2021],
  ["Scandal", "Twice", "Taste Of Love", 2021],
  ["Conversation", "Twice", "Taste Of Love", 2021],
  ["Baby Blue Love", "Twice", "Taste Of Love", 2021],
  ["SOS", "Twice", "Taste Of Love", 2021],
  ["I love you more than anyone", "Twice", "Hospital Playlist S2 OST", 2021],
  ["Perfect World", "Twice", "Perfect World", 2021],
  ["Good at Love", "Twice", "Perfect World", 2021],
  ["Four-leaf Clover", "Twice", "Perfect World", 2021],
  ["In the summer", "Twice", "Perfect World", 2021],
  ["PIECES OF LOVE", "Twice", "Perfect World", 2021],
  ["Thank you, Family", "Twice", "Perfect World", 2021],
  ["PROMISE", "Twice", "Perfect World", 2021],
  ["The Feels", "Twice", "The Feels", 2021],
  ["Scientist", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Moonlight", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Icon", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Cruel", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Real You", "Twice", "Formula of Love: O+T=<3", 2021],
  ["F.I.L.A (Fall In Love Again)", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Last Waltz", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Espresso", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Rewind", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Cactus", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Push & Pull", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Hello", "Twice", "Formula of Love: O+T=<3", 2021],
  ["1, 3, 2", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Candy", "Twice", "Formula of Love: O+T=<3", 2021],
  ["Doughnut", "Twice", "Doughnut", 2021],
  ["Wonderful Day", "Twice", "Doughnut", 2021],
  ["Just Be Yourself", "Twice", "Just Be Yourself", 2022],
  ["Celebrate", "Twice", "Celebrate", 2022],
  ["Voices of Delight", "Twice", "Celebrate", 2022],
  ["TICK TOCK", "Twice", "Celebrate", 2022],
  ["Flow like waves", "Twice", "Celebrate", 2022],
  ["That's all I'm saying", "Twice", "Celebrate", 2022],
  ["Bitter Sweet", "Twice", "Celebrate", 2022],
  ["Sandcastle", "Twice", "Celebrate", 2022],
  ["Talk That Talk", "Twice", "Between 1&2", 2022],
  ["Queen Of Hearts", "Twice", "Between 1&2", 2022],
  ["Basics", "Twice", "Between 1&2", 2022],
  ["Trouble", "Twice", "Between 1&2", 2022],
  ["Brave", "Twice", "Between 1&2", 2022],
  ["Gone", "Twice", "Between 1&2", 2022],
  ["When We Were Kids", "Twice", "Between 1&2", 2022],
  ["Moonlight Sunrise", "Twice", "Moonlight Sunrise", 2023],
  ["GOT THE THRILLS", "Twice", "READY TO BE", 2023],
  ["BLAME IT ON ME", "Twice", "READY TO BE", 2023],
  ["WALLFLOWER", "Twice", "READY TO BE", 2023],
  ["CRAZY STUPID LOVE", "Twice", "READY TO BE", 2023],
  ["SET ME FREE", "Twice", "READY TO BE", 2023],
  ["Hare Hare", "Twice", "Hare Hare", 2023],
  ["Catch a Wave", "Twice", "Hare Hare", 2023],
  ["I GOT YOU", "Twice", "With YOU-th", 2024],
  ["ONE SPARK", "Twice", "With YOU-th", 2024],
  ["RUSH", "Twice", "With YOU-th", 2024],
  ["NEW NEW", "Twice", "With YOU-th", 2024],
  ["BLOOM", "Twice", "With YOU-th", 2024],
  ["YOU GET ME", "Twice", "With YOU-th", 2024],
  ["Strategy (ft. Megan Thee Stallion)", "Twice", "STRATEGY", 2024],
  ["Kiss My Troubles Away", "Twice", "STRATEGY", 2024],
  ["Like It Like It", "Twice", "STRATEGY", 2024],
  ["Sweetest Obsession", "Twice", "STRATEGY", 2024],
  ["Keeper", "Twice", "STRATEGY", 2024],
  ["Magical", "Twice", "STRATEGY", 2024],
  ["This Is For", "Twice", "This Is For", 2025],
  ["Four", "Twice", "This Is For", 2025],
  ["Options", "Twice", "This Is For", 2025],
  ["Mars", "Twice", "This Is For", 2025],
  ["Right Hand Girl", "Twice", "This Is For", 2025],
  ["Peach Gelato", "Twice", "This Is For", 2025],
  ["Hi Hello", "Twice", "This Is For", 2025],
  ["Battitude", "Twice", "This Is For", 2025],
  ["Dat Ahh Dat Ooh", "Twice", "This Is For", 2025],
  ["Let Love Go", "Twice", "This Is For", 2025],
  ["G.O.A.T.", "Twice", "This Is For", 2025],
  ["Talk", "Twice", "This Is For", 2025],
  ["Seesaw", "Twice", "This Is For", 2025],
  ["Heartbreak Avenue", "Twice", "This Is For", 2025],
  ["TAKEDOWN (Jeongyeon, Jihyo, Chaeyoung)", "Twice", "This Is For (Deluxe)", 2025],
  ["Enemy", "Twice", "Enemy", 2025],
  ["ME + YOU", "Twice", "Ten: The Story Goes On", 2025],
  ["MEEEEEEE (Nayeon)", "Twice", "Ten: The Story Goes On", 2025],
  ["FIX A DRINK (Jeongyeon)", "Twice", "Ten: The Story Goes On", 2025],
  ["MOVE LIKE THAT (Momo)", "Twice", "Ten: The Story Goes On", 2025],
  ["DECAFFEINATED (Sana)", "Twice", "Ten: The Story Goes On", 2025],
  ["ATM (Jihyo)", "Twice", "Ten: The Story Goes On", 2025],
  ["STONE COLD (Mina)", "Twice", "Ten: The Story Goes On", 2025],
  ["CHESS (Dahyun)", "Twice", "Ten: The Story Goes On", 2025],
  ["IN MY ROOM (Chaeyoung)", "Twice", "Ten: The Story Goes On", 2025],
  ["DIVE IN (Tzuyu)", "Twice", "Ten: The Story Goes On", 2025],
  ["Blue Orangeade", "TXT", "The Dream Chapter: STAR", 2019],
  ["CROWN", "TXT", "The Dream Chapter: STAR", 2019],
  ["Our Summer", "TXT", "The Dream Chapter: STAR", 2019],
  ["Cat & Dog", "TXT", "The Dream Chapter: STAR", 2019],
  ["Nap of a Star", "TXT", "The Dream Chapter: STAR", 2019],
  ["Cat & Dog (English Ver.)", "TXT", "Cat & Dog (English Ver.)", 2019],
  ["Our Summer (Acoustic Mix)", "TXT", "Our Summer (Acoustic Mix)", 2019],
  ["New Rules", "TXT", "The Dream Chapter: MAGIC", 2019],
  ["Run Away", "TXT", "The Dream Chapter: MAGIC", 2019],
  ["Roller Coaster", "TXT", "The Dream Chapter: MAGIC", 2019],
  ["Poppin' Star", "TXT", "The Dream Chapter: MAGIC", 2019],
  ["Can't We Just Leave The Monster Alive?", "TXT", "The Dream Chapter: MAGIC", 2019],
  ["Magic Island", "TXT", "The Dream Chapter: MAGIC", 2019],
  ["20cm", "TXT", "The Dream Chapter: MAGIC", 2019],
  ["Angel or Devil", "TXT", "The Dream Chapter: MAGIC", 2019],
  ["Drama", "TXT", "The Dream Chapter: ETERNITY", 2020],
  ["Can't You See Me?", "TXT", "The Dream Chapter: ETERNITY", 2020],
  ["Fairy of Shampoo", "TXT", "The Dream Chapter: ETERNITY", 2020],
  ["Maze in the Mirror", "TXT", "The Dream Chapter: ETERNITY", 2020],
  ["PUMA", "TXT", "The Dream Chapter: ETERNITY", 2020],
  ["Eternally", "TXT", "The Dream Chapter: ETERNITY", 2020],
  ["Ghosting", "TXT", "minisode1 : Blue Hour", 2020],
  ["Blue Hour", "TXT", "minisode1 : Blue Hour", 2020],
  ["We Lost The Summer", "TXT", "minisode1 : Blue Hour", 2020],
  ["Wishlist", "TXT", "minisode1 : Blue Hour", 2020],
  ["Way Home", "TXT", "minisode1 : Blue Hour", 2020],
  ["Intro : Dreaming", "TXT", "Still Dreaming", 2021],
  ["Force", "TXT", "Still Dreaming", 2021],
  ["Everlasting Shine", "TXT", "Still Dreaming", 2021],
  ["Outro : Still", "TXT", "Still Dreaming", 2021],
  ["Anti-Romantic", "TXT", "The Chaos Chapter: FREEZE", 2021],
  ["0X1=LOVESONG (I Know I Love You) feat. Seori", "TXT", "The Chaos Chapter: FREEZE", 2021],
  ["Magic", "TXT", "The Chaos Chapter: FREEZE", 2021],
  ["Ice Cream", "TXT", "The Chaos Chapter: FREEZE", 2021],
  ["What If I Had Been That PUMA", "TXT", "The Chaos Chapter: FREEZE", 2021],
  ["No Rules", "TXT", "The Chaos Chapter: FREEZE", 2021],
  ["Dear Sputnik", "TXT", "The Chaos Chapter: FREEZE", 2021],
  ["Frost", "TXT", "The Chaos Chapter: FREEZE", 2021],
  ["LO$ER=LO(heart)ER", "TXT", "The Chaos Chapter: FIGHT OR ESCAPE", 2021],
  ["MOA Diary (Dubaddu Wari Wari)", "TXT", "The Chaos Chapter: FIGHT OR ESCAPE", 2021],
  ["Ito", "TXT", "Chaotic Wonderland", 2021],
  ["Opening Sequence", "TXT", "minisode 2: Thursday's Child", 2022],
  ["Good Boy Gone Bad", "TXT", "minisode 2: Thursday's Child", 2022],
  ["Trust Fund Baby", "TXT", "minisode 2: Thursday's Child", 2022],
  ["Lonely Boy (The tattoo on my ring finger)", "TXT", "minisode 2: Thursday's Child", 2022],
  ["Thursday's Child Has Far To Go", "TXT", "minisode 2: Thursday's Child", 2022],
  ["Valley of Lies (feat. iann dior)", "TXT", "Valley of Lies", 2022],
  ["Ring", "TXT", "Ring", 2022],
  ["Hitori no Yoru", "TXT", "GOOD BOY GONE BAD", 2022],
  ["Free Falling", "TXT", "Free Falling (The Star Seekers OST)", 2022],
  ["Devil by the Window", "TXT", "The Name Chapter: TEMPTATION", 2023],
  ["Sugar Rush Ride", "TXT", "The Name Chapter: TEMPTATION", 2023],
  ["Happy Fools (feat. Coi Leray)", "TXT", "The Name Chapter: TEMPTATION", 2023],
  ["Tinnitus (Wanna be a rock)", "TXT", "The Name Chapter: TEMPTATION", 2023],
  ["Farewell, Neverland", "TXT", "The Name Chapter: TEMPTATION", 2023],
  ["Goodbye Now", "TXT", "Goodbye Now (Love Revolution OST)", 2023],
  ["Hydrangea Love", "TXT", "SWEET", 2023],
  ["Do It Like That (with Jonas Brothers)", "TXT", "Do It Like That", 2023],
  ["Back for More (with Anitta)", "TXT", "Back for More", 2023],
  ["Growing Pain", "TXT", "The Name Chapter: FREEFALL", 2023],
  ["Chasing That Feeling", "TXT", "The Name Chapter: FREEFALL", 2023],
  ["Back For More (TXT ver.)", "TXT", "The Name Chapter: FREEFALL", 2023],
  ["Dreamer", "TXT", "The Name Chapter: FREEFALL", 2023],
  ["Deep Down", "TXT", "The Name Chapter: FREEFALL", 2023],
  ["Happily Ever After", "TXT", "The Name Chapter: FREEFALL", 2023],
  ["Skipping Stones", "TXT", "The Name Chapter: FREEFALL", 2023],
  ["Blue Spring", "TXT", "The Name Chapter: FREEFALL", 2023],
  ["I'll See You There Tomorrow", "TXT", "minisode 3: TOMORROW", 2024],
  ["Deja Vu", "TXT", "minisode 3: TOMORROW", 2024],
  ["Miracle", "TXT", "minisode 3: TOMORROW", 2024],
  ["The Killa (I Belong To You)", "TXT", "minisode 3: TOMORROW", 2024],
  ["Quarter Life", "TXT", "minisode 3: TOMORROW", 2024],
  ["We'll Never Change", "TXT", "CHIKAI", 2024],
  ["Kitto Zutto", "TXT", "CHIKAI", 2024],
  ["Open Always Wins", "TXT", "Open Always Wins", 2024],
  ["Love Story", "TXT", "Love Story", 2024],
  ["Heaven", "TXT", "The Star Chapter: SANCTUARY", 2024],
  ["Over the Moon", "TXT", "The Star Chapter: SANCTUARY", 2024],
  ["Danger", "TXT", "The Star Chapter: SANCTUARY", 2024],
  ["Resist (Not Gonna Run Away)", "TXT", "The Star Chapter: SANCTUARY", 2024],
  ["Forty One Winks", "TXT", "The Star Chapter: SANCTUARY", 2024],
  ["Higher Than Heaven", "TXT", "The Star Chapter: SANCTUARY", 2024],
  ["Can't Stop", "TXT", "5 (Original Soundtrack)", 2024],
  ["Rise", "TXT", "Rise", 2025],
  ["Love Language", "TXT", "Love Language", 2025],
  ["When the Day Comes", "TXT", "Resident Playbook OST", 2025],
  ["Step by Step", "TXT", "Step by Step", 2025],
  ["Upside Down Kiss", "TXT", "The Star Chapter: TOGETHER", 2025],
  ["Beautiful Strangers", "TXT", "The Star Chapter: TOGETHER", 2025],
  ["Ghost Girl", "TXT", "The Star Chapter: TOGETHER", 2025],
  ["Sunday Driver", "TXT", "The Star Chapter: TOGETHER", 2025],
  ["Dance With You", "TXT", "The Star Chapter: TOGETHER", 2025],
  ["Take My Half", "TXT", "The Star Chapter: TOGETHER", 2025],
  ["Bird of Night", "TXT", "The Star Chapter: TOGETHER", 2025],
  ["The Song of the Star", "TXT", "The Star Chapter: TOGETHER", 2025],
  ["Intro : SPARK", "TXT", "Starkissed", 2025],
  ["Where Do You Go?", "TXT", "Starkissed", 2025],
  ["SSS (Sending Secret Signal)", "TXT", "Starkissed", 2025],
  ["Outro : GLOW", "TXT", "Starkissed", 2025],
  ["SSS (Sending Secret Signals) (feat. HYDE)", "TXT", "SSS (Sending Secret Signals)", 2026],
  ["Bed of Thorns", "TXT", "7TH YEAR: A Moment of Stillness in the Thorns", 2026],
  ["Stick With You", "TXT", "7TH YEAR: A Moment of Stillness in the Thorns", 2026],
  ["Take Me to Nirvana (feat. Vinida Weng)", "TXT", "7TH YEAR: A Moment of Stillness in the Thorns", 2026],
  ["So What", "TXT", "7TH YEAR: A Moment of Stillness in the Thorns", 2026],
  ["21st Century Romance", "TXT", "7TH YEAR: A Moment of Stillness in the Thorns", 2026],
  ["Dream of Mine", "TXT", "7TH YEAR: A Moment of Stillness in the Thorns", 2026],
  ["Setsuna Hanabi", "TXT", "Setsuna Hanabi", 2026],
  ["Silence", "TXT", "Setsuna Hanabi", 2026],
  ["Replay", "SHINee", "Replay", 2008],
  ["In My Room", "SHINee", "Replay", 2008],
  ["Real", "SHINee", "Replay", 2008],
  ["Love Should Go On", "SHINee", "Replay", 2008],
  ["The SHINee World (Doo-Bop)", "SHINee", "The SHINee World", 2008],
  ["Love's Way", "SHINee", "The SHINee World", 2008],
  ["Love Like Oxygen", "SHINee", "The SHINee World", 2008],
  ["Romantic", "SHINee", "The SHINee World", 2008],
  ["One For Me", "SHINee", "The SHINee World", 2008],
  ["Graze", "SHINee", "The SHINee World", 2008],
  ["Last Gift (In My Room Prelude)", "SHINee", "The SHINee World", 2008],
  ["Best Place", "SHINee", "The SHINee World", 2008],
  ["Y Si Fuera Ella", "SHINee", "The SHINee World", 2008],
  ["Four Seasons", "SHINee", "The SHINee World", 2008],
  ["Amigo", "SHINee", "Amigo", 2008],
  ["Forever or Never", "SHINee", "Amigo", 2008],
  ["Stand By Me", "SHINee", "Boys Over Flowers OST", 2009],
  ["Juliette", "SHINee", "Romeo", 2009],
  ["Y.O.U. (Year of Us)", "SHINee", "2009, Year of Us", 2009],
  ["Ring Ding Dong", "SHINee", "2009, Year of Us", 2009],
  ["JoJo", "SHINee", "2009, Year of Us", 2009],
  ["Up & Down", "SHINee", "Lucifer", 2010],
  ["Lucifer", "SHINee", "Lucifer", 2010],
  ["Electric Heart", "SHINee", "Lucifer", 2010],
  ["A-Yo", "SHINee", "Lucifer", 2010],
  ["Obsession", "SHINee", "Lucifer", 2010],
  ["Quasimodo", "SHINee", "Lucifer", 2010],
  ["Shout Out", "SHINee", "Lucifer", 2010],
  ["WOWOWOW", "SHINee", "Lucifer", 2010],
  ["Your Name", "SHINee", "Lucifer", 2010],
  ["Life", "SHINee", "Lucifer", 2010],
  ["Ready Or Not", "SHINee", "Lucifer", 2010],
  ["Love Pain", "SHINee", "Lucifer", 2010],
  ["Love Still Goes On", "SHINee", "Lucifer", 2010],
  ["Hello", "SHINee", "Hello", 2010],
  ["One", "SHINee", "Hello", 2010],
  ["Get It", "SHINee", "Hello", 2010],
  ["To Your Heart", "SHINee", "The First", 2011],
  ["Stranger", "SHINee", "The First", 2011],
  ["Sherlock (Clue + Note)", "SHINee", "Sherlock", 2012],
  ["Clue", "SHINee", "Sherlock", 2012],
  ["Note", "SHINee", "Sherlock", 2012],
  ["Alarm Clock", "SHINee", "Sherlock", 2012],
  ["The Reason", "SHINee", "Sherlock", 2012],
  ["Honesty", "SHINee", "Sherlock", 2012],
  ["Dazzling Girl", "SHINee", "Dazzling Girl", 2012],
  ["Run With Me", "SHINee", "Dazzling Girl", 2012],
  ["1000-nen, Zutto Soba ni Ite...", "SHINee", "1000-nen, Zutto Soba ni Ite...", 2012],
  ["Spoiler", "SHINee", "Dream Girl - The Misconceptions of You", 2013],
  ["Dream Girl", "SHINee", "Dream Girl - The Misconceptions of You", 2013],
  ["Hitchhiking", "SHINee", "Dream Girl - The Misconceptions of You", 2013],
  ["Punch Drunk Love", "SHINee", "Dream Girl - The Misconceptions of You", 2013],
  ["Girls Girls Girls", "SHINee", "Dream Girl - The Misconceptions of You", 2013],
  ["Aside", "SHINee", "Dream Girl - The Misconceptions of You", 2013],
  ["Beautiful", "SHINee", "Dream Girl - The Misconceptions of You", 2013],
  ["Dynamite", "SHINee", "Dream Girl - The Misconceptions of You", 2013],
  ["Runaway", "SHINee", "Dream Girl - The Misconceptions of You", 2013],
  ["Fire", "SHINee", "Fire", 2013],
  ["Moon River Waltz", "SHINee", "Fire", 2013],
  ["Nightmare", "SHINee", "Why So Serious? - The Misconceptions of Me", 2013],
  ["Why So Serious?", "SHINee", "Why So Serious? - The Misconceptions of Me", 2013],
  ["SHINe (Medusa I)", "SHINee", "Why So Serious? - The Misconceptions of Me", 2013],
  ["Orgel", "SHINee", "Why So Serious? - The Misconceptions of Me", 2013],
  ["Dangerous (Medusa II)", "SHINee", "Why So Serious? - The Misconceptions of Me", 2013],
  ["Like A Fire", "SHINee", "Why So Serious? - The Misconceptions of Me", 2013],
  ["Excuse Me Miss", "SHINee", "Why So Serious? - The Misconceptions of Me", 2013],
  ["Evil", "SHINee", "Why So Serious? - The Misconceptions of Me", 2013],
  ["Sleepless Night", "SHINee", "Why So Serious? - The Misconceptions of Me", 2013],
  ["Password", "SHINee", "Boys Meet U", 2013],
  ["Breaking News", "SHINee", "Boys Meet U", 2013],
  ["Selene 6.23", "SHINee", "The Misconceptions of Us", 2013],
  ["Better Off", "SHINee", "The Misconceptions of Us", 2013],
  ["Everybody", "SHINee", "Everybody", 2013],
  ["Symptoms", "SHINee", "Everybody", 2013],
  ["Queen Of New York", "SHINee", "Everybody", 2013],
  ["One Minute Back", "SHINee", "Everybody", 2013],
  ["Destination", "SHINee", "Everybody", 2013],
  ["Close The Door", "SHINee", "Everybody", 2013],
  ["Colorful", "SHINee", "Everybody", 2013],
  ["3 2 1", "SHINee", "3 2 1", 2013],
  ["Lucky Star", "SHINee", "Lucky Star", 2014],
  ["Downtown Baby", "SHINee", "I'm Your Boy", 2014],
  ["Picasso", "SHINee", "I'm Your Boy", 2014],
  ["365", "SHINee", "I'm Your Boy", 2014],
  ["Odd Eye", "SHINee", "Odd", 2015],
  ["Love Sick", "SHINee", "Odd", 2015],
  ["View", "SHINee", "Odd", 2015],
  ["Romance", "SHINee", "Odd", 2015],
  ["Trigger", "SHINee", "Odd", 2015],
  ["Farewell My Love", "SHINee", "Odd", 2015],
  ["An Ode To You", "SHINee", "Odd", 2015],
  ["Hold You", "SHINee", "Odd", 2015],
  ["Alive", "SHINee", "Odd", 2015],
  ["Woof Woof", "SHINee", "Odd", 2015],
  ["Chocolate", "SHINee", "Odd", 2015],
  ["Black Hole", "SHINee", "Odd", 2015],
  ["An Encore", "SHINee", "Odd", 2015],
  ["Married To The Music", "SHINee", "Married To The Music", 2015],
  ["SAVIOR", "SHINee", "Married To The Music", 2015],
  ["Sing Your Song", "SHINee", "Sing Your Song", 2015],
  ["D x D x D", "SHINee", "D x D x D", 2016],
  ["Your Number", "SHINee", "D x D x D", 2016],
  ["Kimi no Sei de", "SHINee", "Kimi no Sei de", 2016],
  ["Prism", "SHINee", "1 of 1", 2016],
  ["1 of 1", "SHINee", "1 of 1", 2016],
  ["Feel Good", "SHINee", "1 of 1", 2016],
  ["Don't Let Me Go", "SHINee", "1 of 1", 2016],
  ["Lipstick", "SHINee", "1 of 1", 2016],
  ["Don't Stop", "SHINee", "1 of 1", 2016],
  ["SHIFT", "SHINee", "1 of 1", 2016],
  ["U Need Me", "SHINee", "1 of 1", 2016],
  ["So Amazing", "SHINee", "1 of 1", 2016],
  ["Tell Me What To Do", "SHINee", "1 and 1", 2016],
  ["Wish Upon A Star", "SHINee", "1 and 1", 2016],
  ["Beautiful Life", "SHINee", "1 and 1", 2016],
  ["Rescue", "SHINee", "1 and 1", 2016],
  ["If You Love Her", "SHINee", "1 and 1", 2016],
  ["Winter Wonderland", "SHINee", "Winter Wonderland", 2016],
  ["Get The Treasure", "SHINee", "FIVE", 2017],
  ["Gentleman", "SHINee", "FIVE", 2017],
  ["From Now On", "SHINee", "SHINee THE BEST FROM NOW ON", 2018],
  ["Every Time", "SHINee", "SHINee THE BEST FROM NOW ON", 2018],
  ["All Day All Night", "SHINee", "The Story Of Light EP.1", 2018],
  ["Good Evening", "SHINee", "The Story Of Light EP.1", 2018],
  ["Undercover", "SHINee", "The Story Of Light EP.1", 2018],
  ["JUMP", "SHINee", "The Story Of Light EP.1", 2018],
  ["You & I", "SHINee", "The Story Of Light EP.1", 2018],
  ["I Want You", "SHINee", "The Story Of Light EP.2", 2018],
  ["Chemistry", "SHINee", "The Story Of Light EP.2", 2018],
  ["Electric", "SHINee", "The Story Of Light EP.2", 2018],
  ["Drive", "SHINee", "The Story Of Light EP.2", 2018],
  ["Who Waits For Love", "SHINee", "The Story Of Light EP.2", 2018],
  ["Our Page", "SHINee", "The Story Of Light EP.3", 2018],
  ["Tonight", "SHINee", "The Story Of Light EP.3", 2018],
  ["Retro", "SHINee", "The Story Of Light EP.3", 2018],
  ["I Say", "SHINee", "The Story Of Light EP.3", 2018],
  ["Lock You Down", "SHINee", "The Story Of Light EP.3", 2018],
  ["Countless", "SHINee", "'The Story of Light' Epilogue", 2018],
  ["Sunny Side", "SHINee", "Sunny Side", 2018],
  ["Don't Call Me", "SHINee", "Don't Call Me", 2021],
  ["Heart Attack", "SHINee", "Don't Call Me", 2021],
  ["Marry You", "SHINee", "Don't Call Me", 2021],
  ["CODE", "SHINee", "Don't Call Me", 2021],
  ["I Really Want You", "SHINee", "Don't Call Me", 2021],
  ["Kiss Kiss", "SHINee", "Don't Call Me", 2021],
  ["Body Rhythm", "SHINee", "Don't Call Me", 2021],
  ["Attention", "SHINee", "Don't Call Me", 2021],
  ["Kind", "SHINee", "Don't Call Me", 2021],
  ["Atlantis", "SHINee", "Atlantis", 2021],
  ["Area", "SHINee", "Atlantis", 2021],
  ["Days and Years", "SHINee", "Atlantis", 2021],
  ["SuperStar", "SHINee", "SUPERSTAR", 2021],
  ["Closer", "SHINee", "SUPERSTAR", 2021],
  ["SEASONS", "SHINee", "SUPERSTAR", 2021],
  ["HARD", "SHINee", "HARD", 2023],
  ["JUICE", "SHINee", "HARD", 2023],
  ["10X", "SHINee", "HARD", 2023],
  ["Identity", "SHINee", "HARD", 2023],
  ["The Feeling", "SHINee", "HARD", 2023],
  ["Like It", "SHINee", "HARD", 2023],
  ["Sweet Misery", "SHINee", "HARD", 2023],
  ["Insomnia", "SHINee", "HARD", 2023],
  ["Gravity", "SHINee", "HARD", 2023],
  ["Poet | Artist", "SHINee", "Poet | Artist", 2025],
  ["Atmos", "SHINee", "Atmos", 2026],
  ["HOURS", "SHINee", "Atmos", 2026],
  ["Possibility", "SHINee", "Atmos", 2026],
  ["Anti Believer", "SHINee", "Atmos", 2026],
  ["Still Raining", "SHINee", "Atmos", 2026],
  ["Thousand Miles Away", "SHINee", "Atmos", 2026],
  ["Hellevator", "Stray Kids", "Hellevator", 2017],
  ["Grrr", "Stray Kids", "Mixtape", 2018],
  ["Spread My Wings", "Stray Kids", "Mixtape", 2018],
  ["YAYAYA", "Stray Kids", "Mixtape", 2018],
  ["Glow", "Stray Kids", "Mixtape", 2018],
  ["School Life", "Stray Kids", "Mixtape", 2018],
  ["4419", "Stray Kids", "Mixtape", 2018],
  ["NOT!", "Stray Kids", "I Am NOT", 2018],
  ["District 9", "Stray Kids", "I Am NOT", 2018],
  ["Mirror", "Stray Kids", "I Am NOT", 2018],
  ["Awaken", "Stray Kids", "I Am NOT", 2018],
  ["Rock", "Stray Kids", "I Am NOT", 2018],
  ["Grow Up", "Stray Kids", "I Am NOT", 2018],
  ["3rd Eye", "Stray Kids", "I Am NOT", 2018],
  ["Mixtape #1", "Stray Kids", "I Am NOT", 2018],
  ["WHO?", "Stray Kids", "I Am WHO?", 2018],
  ["My Pace", "Stray Kids", "I Am WHO?", 2018],
  ["Voices", "Stray Kids", "I Am WHO?", 2018],
  ["Question", "Stray Kids", "I Am WHO?", 2018],
  ["Insomnia", "Stray Kids", "I Am WHO?", 2018],
  ["M.I.A.", "Stray Kids", "I Am WHO?", 2018],
  ["Awkward Silence", "Stray Kids", "I Am WHO?", 2018],
  ["Mixtape #2", "Stray Kids", "I Am WHO?", 2018],
  ["YOU.", "Stray Kids", "I Am YOU", 2018],
  ["I Am YOU", "Stray Kids", "I Am YOU", 2018],
  ["My Side", "Stray Kids", "I Am YOU", 2018],
  ["Hero's Soup", "Stray Kids", "I Am YOU", 2018],
  ["Get Cool", "Stray Kids", "I Am YOU", 2018],
  ["N/S", "Stray Kids", "I Am YOU", 2018],
  ["0325", "Stray Kids", "I Am YOU", 2018],
  ["Mixtape #3", "Stray Kids", "I Am YOU", 2018],
  ["Entrance", "Stray Kids", "Cle 1 : MIROH", 2019],
  ["Miroh", "Stray Kids", "Cle 1 : MIROH", 2019],
  ["Victory Song", "Stray Kids", "Cle 1 : MIROH", 2019],
  ["Maze Of Memories", "Stray Kids", "Cle 1 : MIROH", 2019],
  ["Boxer", "Stray Kids", "Cle 1 : MIROH", 2019],
  ["Chronosaurus", "Stray Kids", "Cle 1 : MIROH", 2019],
  ["19", "Stray Kids", "Cle 1 : MIROH", 2019],
  ["Mixtape #4", "Stray Kids", "Cle 1 : MIROH", 2019],
  ["Side Effects", "Stray Kids", "Cle 2 : Yellow Wood", 2019],
  ["TMT", "Stray Kids", "Cle 2 : Yellow Wood", 2019],
  ["Mixtape #5", "Stray Kids", "Cle 2 : Yellow Wood", 2019],
  ["Double Knot", "Stray Kids", "Double Knot", 2019],
  ["Stop", "Stray Kids", "Cle : LEVANTER", 2019],
  ["Levanter", "Stray Kids", "Cle : LEVANTER", 2019],
  ["Booster", "Stray Kids", "Cle : LEVANTER", 2019],
  ["Astronaut", "Stray Kids", "Cle : LEVANTER", 2019],
  ["Sunshine", "Stray Kids", "Cle : LEVANTER", 2019],
  ["You Can Stay", "Stray Kids", "Cle : LEVANTER", 2019],
  ["Mixtape: On Track", "Stray Kids", "Mixtape: On Track", 2020],
  ["TOP", "Stray Kids", "TOP", 2020],
  ["SLUMP", "Stray Kids", "TOP", 2020],
  ["GO LIVE", "Stray Kids", "GO LIVE", 2020],
  ["God's Menu", "Stray Kids", "GO LIVE", 2020],
  ["Easy", "Stray Kids", "GO LIVE", 2020],
  ["Pacemaker", "Stray Kids", "GO LIVE", 2020],
  ["Airplane", "Stray Kids", "GO LIVE", 2020],
  ["Another Day", "Stray Kids", "GO LIVE", 2020],
  ["Phobia", "Stray Kids", "GO LIVE", 2020],
  ["Blueprint", "Stray Kids", "GO LIVE", 2020],
  ["Ta", "Stray Kids", "GO LIVE", 2020],
  ["Haven", "Stray Kids", "GO LIVE", 2020],
  ["The Hare and the Tortoise", "Stray Kids", "IN LIFE", 2020],
  ["Back Door", "Stray Kids", "IN LIFE", 2020],
  ["B Me", "Stray Kids", "IN LIFE", 2020],
  ["Any", "Stray Kids", "IN LIFE", 2020],
  ["Ex", "Stray Kids", "IN LIFE", 2020],
  ["We Go", "Stray Kids", "IN LIFE", 2020],
  ["Wow", "Stray Kids", "IN LIFE", 2020],
  ["My Universe", "Stray Kids", "IN LIFE", 2020],
  ["ALL IN", "Stray Kids", "ALL IN", 2020],
  ["Fam", "Stray Kids", "ALL IN", 2020],
  ["One Day", "Stray Kids", "ALL IN", 2020],
  ["Oh", "Stray Kids", "Mixtape : Oh", 2021],
  ["CHEESE", "Stray Kids", "NOEASY", 2021],
  ["THUNDEROUS", "Stray Kids", "NOEASY", 2021],
  ["DOMINO", "Stray Kids", "NOEASY", 2021],
  ["SSICK", "Stray Kids", "NOEASY", 2021],
  ["The View", "Stray Kids", "NOEASY", 2021],
  ["Sorry, I Love You", "Stray Kids", "NOEASY", 2021],
  ["Silent Cry", "Stray Kids", "NOEASY", 2021],
  ["Secret Secret", "Stray Kids", "NOEASY", 2021],
  ["Star Lost", "Stray Kids", "NOEASY", 2021],
  ["Red Lights", "Stray Kids", "NOEASY", 2021],
  ["Surfin'", "Stray Kids", "NOEASY", 2021],
  ["Gone Away", "Stray Kids", "NOEASY", 2021],
  ["WOLFGANG", "Stray Kids", "NOEASY", 2021],
  ["Christmas EveL", "Stray Kids", "Christmas EveL", 2021],
  ["24 to 25", "Stray Kids", "Christmas EveL", 2021],
  ["Winter Falls", "Stray Kids", "Christmas EveL", 2021],
  ["VENOM", "Stray Kids", "ODDINARY", 2022],
  ["MANIAC", "Stray Kids", "ODDINARY", 2022],
  ["Charmer", "Stray Kids", "ODDINARY", 2022],
  ["FREEZE", "Stray Kids", "ODDINARY", 2022],
  ["Lonely St.", "Stray Kids", "ODDINARY", 2022],
  ["Waiting For Us", "Stray Kids", "ODDINARY", 2022],
  ["Muddy Water", "Stray Kids", "ODDINARY", 2022],
  ["CIRCUS", "Stray Kids", "CIRCUS", 2022],
  ["Fairytail", "Stray Kids", "CIRCUS", 2022],
  ["Your Eyes", "Stray Kids", "CIRCUS", 2022],
  ["Time Out", "Stray Kids", "Mixtape : Time Out", 2022],
  ["CASE 143", "Stray Kids", "MAXIDENT", 2022],
  ["Chill", "Stray Kids", "MAXIDENT", 2022],
  ["Give Me Your TMI", "Stray Kids", "MAXIDENT", 2022],
  ["SUPER BOARD", "Stray Kids", "MAXIDENT", 2022],
  ["3RACHA", "Stray Kids", "MAXIDENT", 2022],
  ["TASTE", "Stray Kids", "MAXIDENT", 2022],
  ["Can't Stop", "Stray Kids", "MAXIDENT", 2022],
  ["Connected", "Stray Kids", "SKZ-REPLAY", 2022],
  ["Limbo", "Stray Kids", "SKZ-REPLAY", 2022],
  ["DOODLE", "Stray Kids", "SKZ-REPLAY", 2022],
  ["Love Untold", "Stray Kids", "SKZ-REPLAY", 2022],
  ["RUN", "Stray Kids", "SKZ-REPLAY", 2022],
  ["Deep End", "Stray Kids", "SKZ-REPLAY", 2022],
  ["Stars and Raindrops", "Stray Kids", "SKZ-REPLAY", 2022],
  ["Hug Me", "Stray Kids", "SKZ-REPLAY", 2022],
  ["#LoveSTAY", "Stray Kids", "SKZ-REPLAY", 2022],
  ["THE SOUND", "Stray Kids", "THE SOUND", 2023],
  ["DLMLU", "Stray Kids", "THE SOUND", 2023],
  ["Novel", "Stray Kids", "THE SOUND", 2023],
  ["Hall of Fame", "Stray Kids", "5-STAR", 2023],
  ["S-Class", "Stray Kids", "5-STAR", 2023],
  ["ITEM", "Stray Kids", "5-STAR", 2023],
  ["Super Bowl", "Stray Kids", "5-STAR", 2023],
  ["TOPLINE feat. Tiger JK", "Stray Kids", "5-STAR", 2023],
  ["DLC", "Stray Kids", "5-STAR", 2023],
  ["GET LIT", "Stray Kids", "5-STAR", 2023],
  ["Collision", "Stray Kids", "5-STAR", 2023],
  ["FNF", "Stray Kids", "5-STAR", 2023],
  ["Youtiful", "Stray Kids", "5-STAR", 2023],
  ["MEGAVERSE", "Stray Kids", "ROCK-STAR", 2023],
  ["LALALALA", "Stray Kids", "ROCK-STAR", 2023],
  ["BLIND SPOT", "Stray Kids", "ROCK-STAR", 2023],
  ["COMFLEX", "Stray Kids", "ROCK-STAR", 2023],
  ["Cover Me", "Stray Kids", "ROCK-STAR", 2023],
  ["Leave", "Stray Kids", "ROCK-STAR", 2023],
  ["Social Path feat. LiSA", "Stray Kids", "ROCK-STAR", 2023],
  ["Lose My Breath feat. Charlie Puth", "Stray Kids", "Lose My Breath", 2024],
  ["MOUNTAINS", "Stray Kids", "ATE", 2024],
  ["Chk Chk Boom", "Stray Kids", "ATE", 2024],
  ["JJAM", "Stray Kids", "ATE", 2024],
  ["I Like It", "Stray Kids", "ATE", 2024],
  ["Runners", "Stray Kids", "ATE", 2024],
  ["twilight", "Stray Kids", "ATE", 2024],
  ["Stray Kids", "Stray Kids", "ATE", 2024],
  ["Night", "Stray Kids", "HOP", 2024],
  ["Falling Up", "Stray Kids", "HOP", 2024],
  ["Walkin On Water", "Stray Kids", "HOP", 2024],
  ["Bounce Back", "Stray Kids", "HOP", 2024],
  ["U", "Stray Kids", "HOP", 2024],
  ["Giant", "Stray Kids", "GIANT", 2024],
  ["Chku Chku Boom", "Stray Kids", "GIANT", 2024],
  ["WHY?", "Stray Kids", "GIANT", 2024],
  ["Saiyan", "Stray Kids", "Single", 2025],
  ["Karma", "Stray Kids", "Karma", 2025],
  ["Do It", "Stray Kids", "Do It", 2025],
  ["This & That", "Stray Kids", "This & That", 2026],
  ["SKZ-Replay 2026 Pt.1", "Stray Kids", "SKZ-Replay 2026 Pt.1", 2026],
  ["Under the skin", "&TEAM", "First Howling : ME", 2022],
  ["Scent of you", "&TEAM", "First Howling : ME", 2022],
  ["Buzz Love", "&TEAM", "First Howling : ME", 2022],
  ["The Final Countdown (&TEAM ver.)", "&TEAM", "First Howling : ME", 2022],
  ["FIREWORK", "&TEAM", "First Howling : WE", 2023],
  ["Road Not Taken", "&TEAM", "First Howling : WE", 2023],
  ["The moon is beautiful", "&TEAM", "First Howling : WE", 2023],
  ["Blind Love", "&TEAM", "First Howling : WE", 2023],
  ["FIREWORK (Korean ver.)", "&TEAM", "First Howling : WE", 2023],
  ["Scent of you (Korean ver.)", "&TEAM", "First Howling : WE", 2023],
  ["War Cry", "&TEAM", "First Howling : NOW", 2023],
  ["Dropkick", "&TEAM", "First Howling : NOW", 2023],
  ["Really Crazy", "&TEAM", "First Howling : NOW", 2023],
  ["ALIEN", "&TEAM", "First Howling : NOW", 2023],
  ["War Cry (Korean ver.)", "&TEAM", "First Howling : NOW", 2023],
  ["Road Not Taken (Korean ver.)", "&TEAM", "First Howling : NOW", 2023],
  ["Melody (&TEAM ver.)", "&TEAM", "First Howling : NOW", 2023],
  ["Running with the pack (&TEAM ver.)", "&TEAM", "First Howling : NOW", 2023],
  ["Samidare", "&TEAM", "Samidare", 2024],
  ["Scar to Scar", "&TEAM", "Samidare", 2024],
  ["Maybe", "&TEAM", "Samidare", 2024],
  ["Aoarashi", "&TEAM", "Aoarashi", 2024],
  ["Koegawari", "&TEAM", "Aoarashi", 2024],
  ["Imprinted", "&TEAM", "Aoarashi", 2024],
  ["Yukiakari", "&TEAM", "Yukiakari", 2024],
  ["Jyuugoya", "&TEAM", "Yukiakari", 2024],
  ["Big suki", "&TEAM", "Yukiakari", 2024],
  ["Go in Blind (月狼)", "&TEAM", "Go in Blind (月狼)", 2025],
  ["Run Wild", "&TEAM", "Go in Blind (月狼)", 2025],
  ["オオカミ系男子", "&TEAM", "Go in Blind (月狼)", 2025],
  ["Extraordinary Day", "&TEAM", "Go in Blind (月狼)", 2025],
  ["Go in Blind (Korean ver.)", "&TEAM", "Go in Blind (月狼)", 2025],
  ["Run Wild (Korean ver.)", "&TEAM", "Go in Blind (月狼)", 2025],
  ["Back to Life", "&TEAM", "Back to Life", 2025],
  ["Lunatic", "&TEAM", "Back to Life", 2025],
  ["MISMATCH", "&TEAM", "Back to Life", 2025],
  ["Rush", "&TEAM", "Back to Life", 2025],
  ["Heartbreak Time Machine", "&TEAM", "Back to Life", 2025],
  ["Who am I", "&TEAM", "Back to Life", 2025],
  ["We on Fire", "&TEAM", "We on Fire", 2026],
  ["Bewitched", "&TEAM", "We on Fire", 2026],
  ["HOTLINE", "&TEAM", "We on Fire", 2026],
  ["Sakura-iro Yell", "&TEAM", "We on Fire", 2026],
  ["We on Fire (Korean Ver.)", "&TEAM", "We on Fire", 2026],
  ["Bewitched (Korean Ver.)", "&TEAM", "We on Fire", 2026],
  ["Monster", "Red Velvet - Irene & Seulgi", "Monster", 2020],
  ["Diamond", "Red Velvet - Irene & Seulgi", "Monster", 2020],
  ["Feel Good", "Red Velvet - Irene & Seulgi", "Monster", 2020],
  ["Jelly", "Red Velvet - Irene & Seulgi", "Monster", 2020],
  ["Naughty", "Red Velvet - Irene & Seulgi", "Monster", 2020],
  ["Uncover (Sung by Seulgi)", "Red Velvet - Irene & Seulgi", "Monster", 2020],
  ["TILT", "Red Velvet - Irene & Seulgi", "TILT", 2025],
  ["Diamond Heart", "Red Velvet - Irene & Seulgi", "TILT", 2025],
  ["Automatic High", "Red Velvet - Irene & Seulgi", "TILT", 2025],
  ["Vogue", "Red Velvet - Irene & Seulgi", "TILT", 2025],
  ["Mirror Mirror", "Red Velvet - Irene & Seulgi", "TILT", 2025],
  ["Eclipse", "Red Velvet - Irene & Seulgi", "TILT", 2025],
  ["28 Reasons", "Seulgi", "28 Reasons", 2022],
  ["Dead Man Runnin'", "Seulgi", "28 Reasons", 2022],
  ["Bad Boy, Sad Girl (feat. BE'O)", "Seulgi", "28 Reasons", 2022],
  ["Anywhere But Home", "Seulgi", "28 Reasons", 2022],
  ["Los Angeles", "Seulgi", "28 Reasons", 2022],
  ["Crown", "Seulgi", "28 Reasons", 2022],
  ["Baby, Not Baby", "Seulgi", "Accidentally On Purpose", 2025],
  ["Better Dayz", "Seulgi", "Accidentally On Purpose", 2025],
  ["Rollin' (With My Homies)", "Seulgi", "Accidentally On Purpose", 2025],
  ["Whatever", "Seulgi", "Accidentally On Purpose", 2025],
  ["Praying", "Seulgi", "Accidentally On Purpose", 2025],
  ["Weakness", "Seulgi", "Accidentally On Purpose", 2025],
  ["When This Rain Stops", "Wendy", "Like Water", 2021],
  ["Like Water", "Wendy", "Like Water", 2021],
  ["Why Can't You Love Me?", "Wendy", "Like Water", 2021],
  ["The Road", "Wendy", "Like Water", 2021],
  ["Best Friend (with Seulgi)", "Wendy", "Like Water", 2021],
  ["Hello", "Joy", "Hello", 2021],
  ["Je T'aime", "Joy", "Hello", 2021],
  ["Day By Day", "Joy", "Hello", 2021],
  ["If Only (feat. Paul Kim)", "Joy", "Hello", 2021],
  ["Happy Birthday To You", "Joy", "Hello", 2021],
  ["Be There For You", "Joy", "Hello", 2021],
  ["Do not touch", "MISAMO", "Masterpiece", 2023],
  ["Behind The Curtain", "MISAMO", "Masterpiece", 2023],
  ["Marshmallow", "MISAMO", "Masterpiece", 2023],
  ["Funny Valentine", "MISAMO", "Masterpiece", 2023],
  ["It's not easy for you", "MISAMO", "Masterpiece", 2023],
  ["Rewind You", "MISAMO", "Masterpiece", 2023],
  ["Haute Couture", "MISAMO", "Masterpiece", 2023],
  ["Identity", "MISAMO", "HAUTE COUTURE", 2024],
  ["New Rules", "MISAMO", "HAUTE COUTURE", 2024],
  ["Baby, I'm good", "MISAMO", "HAUTE COUTURE", 2024],
  ["Telephone", "MISAMO", "HAUTE COUTURE", 2024],
  ["The Way You Love Me", "MISAMO", "HAUTE COUTURE", 2024],
  ["Ruby, Red", "MISAMO", "HAUTE COUTURE", 2024],
  ["Bouquet", "MISAMO", "HAUTE COUTURE", 2024],
  ["POP!", "Nayeon", "IM NAYEON", 2022],
  ["NO PROBLEM (feat. Felix of Stray Kids)", "Nayeon", "IM NAYEON", 2022],
  ["SUNSET", "Nayeon", "IM NAYEON", 2022],
  ["PHYLLIS", "Nayeon", "IM NAYEON", 2022],
  ["ALL OR NOTHING", "Nayeon", "IM NAYEON", 2022],
  ["CANDYFLOSS", "Nayeon", "IM NAYEON", 2022],
  ["HAPPY BIRTHDAY TO YOU", "Nayeon", "IM NAYEON", 2022],
  ["LOVE COUNTDOWN (feat. Wonstein)", "Nayeon", "IM NAYEON", 2022],
  ["ABCD", "Nayeon", "NA", 2024],
  ["Butterflies", "Nayeon", "NA", 2024],
  ["Heaven (feat. Sam Kim)", "Nayeon", "NA", 2024],
  ["Magic (feat. Julie of KISS OF LIFE)", "Nayeon", "NA", 2024],
  ["Halli Galli", "Nayeon", "NA", 2024],
  ["Something", "Nayeon", "NA", 2024],
  ["Count It", "Nayeon", "NA", 2024],
  ["Killin' Me Good", "Jihyo", "ZONE", 2023],
  ["Talkin' About It (feat. 24kGoldn)", "Jihyo", "ZONE", 2023],
  ["Closer", "Jihyo", "ZONE", 2023],
  ["Wishing On You", "Jihyo", "ZONE", 2023],
  ["Don't Wanna Go Back (with Heize)", "Jihyo", "ZONE", 2023],
  ["Room", "Jihyo", "ZONE", 2023],
  ["Nightmare", "Jihyo", "ZONE", 2023],
  ["Stardust Love Song", "Jihyo", "ZONE", 2023],
  ["Run Away", "Tzuyu", "abouTZU", 2024],
  ["Heartbreak In Heaven (feat. Peniel of BTOB)", "Tzuyu", "abouTZU", 2024],
  ["Lazy Baby (feat. pH-1)", "Tzuyu", "abouTZU", 2024],
  ["Losing Sleep", "Tzuyu", "abouTZU", 2024],
  ["One Love", "Tzuyu", "abouTZU", 2024],
  ["Fly", "Tzuyu", "abouTZU", 2024],
  ["GGUM", "Yeonjun", "GGUM", 2024],
  ["Talk to You", "Yeonjun", "NO LABELS: PART 01", 2025],
  ["Coma", "Yeonjun", "NO LABELS: PART 01", 2025],
  ["Let Me Tell You (feat. Daniela of KATSEYE)", "Yeonjun", "NO LABELS: PART 01", 2025],
  ["Danger", "Taemin", "ACE", 2014],
  ["Experience", "Taemin", "ACE", 2014],
  ["Pretty Boy (feat. Kai)", "Taemin", "ACE", 2014],
  ["Wicked", "Taemin", "ACE", 2014],
  ["Play Me", "Taemin", "ACE", 2014],
  ["Drip Drop", "Taemin", "Press It", 2016],
  ["Press Your Number", "Taemin", "Press It", 2016],
  ["Soldier", "Taemin", "Press It", 2016],
  ["World", "Taemin", "Press It", 2016],
  ["Moonlight", "Taemin", "Press It", 2016],
  ["Hypnosis", "Taemin", "Press It", 2016],
  ["One By One", "Taemin", "Press It", 2016],
  ["Mystery Lover", "Taemin", "Press It", 2016],
  ["Sexuality", "Taemin", "Press It", 2016],
  ["Until Today", "Taemin", "Press It", 2016],
  ["MOVE", "Taemin", "MOVE", 2017],
  ["Love", "Taemin", "MOVE", 2017],
  ["Crazy 4 U", "Taemin", "MOVE", 2017],
  ["Day and Night", "Taemin", "MOVE", 2017],
  ["Back to You", "Taemin", "MOVE", 2017],
  ["Rise", "Taemin", "MOVE", 2017],
  ["Thirsty", "Taemin", "MOVE", 2017],
  ["Stone Heart", "Taemin", "MOVE", 2017],
  ["Flame of Love (Korean Ver.)", "Taemin", "MOVE", 2017],
  ["WANT", "Taemin", "WANT", 2019],
  ["Artistic Groove", "Taemin", "WANT", 2019],
  ["Shadow", "Taemin", "WANT", 2019],
  ["Truth", "Taemin", "WANT", 2019],
  ["Never Forever", "Taemin", "WANT", 2019],
  ["Monologue", "Taemin", "WANT", 2019],
  ["Want ~Outro~", "Taemin", "WANT", 2019],
  ["Criminal", "Taemin", "Never Gonna Dance Again : Act 1", 2020],
  ["Black Rose (feat. Kid Milli)", "Taemin", "Never Gonna Dance Again : Act 1", 2020],
  ["Strangers", "Taemin", "Never Gonna Dance Again : Act 1", 2020],
  ["Waiting For", "Taemin", "Never Gonna Dance Again : Act 1", 2020],
  ["Famous (Korean Ver.)", "Taemin", "Never Gonna Dance Again : Act 1", 2020],
  ["Clockwork", "Taemin", "Never Gonna Dance Again : Act 1", 2020],
  ["Just Me And You", "Taemin", "Never Gonna Dance Again : Act 1", 2020],
  ["Nemo", "Taemin", "Never Gonna Dance Again : Act 1", 2020],
  ["2 Kids", "Taemin", "Never Gonna Dance Again : Act 1", 2020],
  ["Idea", "Taemin", "Never Gonna Dance Again : Act 2", 2020],
  ["Heaven", "Taemin", "Never Gonna Dance Again : Act 2", 2020],
  ["Impressionable", "Taemin", "Never Gonna Dance Again : Act 2", 2020],
  ["Be Your Enemy (feat. Wendy)", "Taemin", "Never Gonna Dance Again : Act 2", 2020],
  ["Think of You", "Taemin", "Never Gonna Dance Again : Act 2", 2020],
  ["Pansy", "Taemin", "Never Gonna Dance Again : Act 2", 2020],
  ["I Think It's Love", "Taemin", "Never Gonna Dance Again : Act 2", 2020],
  ["Identity", "Taemin", "Never Gonna Dance Again : Act 2", 2020],
  ["Advice", "Taemin", "Advice", 2021],
  ["Light", "Taemin", "Advice", 2021],
  ["If I Could Tell You (with Taeyeon)", "Taemin", "Advice", 2021],
  ["Strings", "Taemin", "Advice", 2021],
  ["SAD KIDS", "Taemin", "Advice", 2021],
  ["Guilty", "Taemin", "Guilty", 2023],
  ["The Rizzness", "Taemin", "Guilty", 2023],
  ["She Loves Me, She Loves Me Not", "Taemin", "Guilty", 2023],
  ["Not Over You", "Taemin", "Guilty", 2023],
  ["Night Away", "Taemin", "Guilty", 2023],
  ["Blue", "Taemin", "Guilty", 2023],
  ["G.O.A.T.", "Taemin", "ETERNAL", 2024],
  ["Sexy In The Air", "Taemin", "ETERNAL", 2024],
  ["Horizon", "Taemin", "ETERNAL", 2024],
  ["The Unknown Sea", "Taemin", "ETERNAL", 2024],
  ["Crush", "Taemin", "ETERNAL", 2024],
  ["Deja Vu", "Taemin", "ETERNAL", 2024],
  ["Say Less", "Taemin", "ETERNAL", 2024],
  ["Permission", "Taemin", "PERMISSION", 2026],
  ["Veil", "Taemin", "PHASE 1 : Soft Violence", 2026],
  ["Long Way Home", "Taemin", "PHASE 1 : Soft Violence", 2026],
  ["Float", "Taemin", "PHASE 1 : Soft Violence", 2026],
  ["Gooey", "Taemin", "PHASE 1 : Soft Violence", 2026],
  ["Sober", "Taemin", "PHASE 1 : Soft Violence", 2026],
  ["Blue", "Onew", "VOICE", 2018],
  ["Your Scent", "Onew", "VOICE", 2018],
  ["Under The Starlight", "Onew", "VOICE", 2018],
  ["Sign", "Onew", "VOICE", 2018],
  ["Illusion", "Onew", "VOICE", 2018],
  ["Shine On You", "Onew", "VOICE", 2018],
  ["Timepiece", "Onew", "VOICE", 2018],
  ["DICE", "Onew", "DICE", 2022],
  ["Sunshine", "Onew", "DICE", 2022],
  ["On The Way", "Onew", "DICE", 2022],
  ["Love Phobia", "Onew", "DICE", 2022],
  ["Yeowoobi", "Onew", "DICE", 2022],
  ["In The Whale", "Onew", "DICE", 2022],
  ["O (Circle)", "Onew", "Circle", 2023],
  ["Cough", "Onew", "Circle", 2023],
  ["Rain On Me", "Onew", "Circle", 2023],
  ["Caramel (feat. Giriboy)", "Onew", "Circle", 2023],
  ["Anywhere", "Onew", "Circle", 2023],
  ["Paradise", "Onew", "Circle", 2023],
  ["Expectations", "Onew", "Circle", 2023],
  ["No Parachute", "Onew", "Circle", 2023],
  ["Walk With You", "Onew", "Circle", 2023],
  ["Always", "Onew", "Circle", 2023],
  ["beat drum", "Onew", "FLOW", 2024],
  ["Hola!", "Onew", "FLOW", 2024],
  ["MAESTRO", "Onew", "FLOW", 2024],
  ["Shape of My Heart", "Onew", "FLOW", 2024],
  ["All Day", "Onew", "FLOW", 2024],
  ["Focus", "Onew", "FLOW", 2024],
  ["Winner", "Onew", "CONNECTION", 2025],
  ["Promise You", "Onew", "CONNECTION", 2025],
  ["Boy", "Onew", "CONNECTION", 2025],
  ["Gradation", "Onew", "CONNECTION", 2025],
  ["Conversation", "Onew", "CONNECTION", 2025],
  ["Yay", "Onew", "CONNECTION", 2025],
  ["Silky", "Onew", "MAD", 2025],
  ["Caffeine", "Onew", "MAD", 2025],
  ["Marshmallow", "Onew", "MAD", 2025],
  ["ANIMALS", "Onew", "MAD", 2025],
  ["Confidence", "Onew", "MAD", 2025],
  ["Oreo Cake", "Onew", "MAD", 2025],
  ["Far Away", "Onew", "PERCENT", 2025],
  ["MAD", "Onew", "PERCENT", 2025],
  ["PERCENT", "Onew", "PERCENT", 2025],
  ["Epilogue", "Onew", "PERCENT", 2025],
  ["Happy Birthday", "Onew", "PERCENT", 2025],
  ["Dot dot dot", "Onew", "TOUGH LOVE", 2026],
  ["Tough Love", "Onew", "TOUGH LOVE", 2026],
  ["Flex on Me", "Onew", "TOUGH LOVE", 2026],
  ["Lie", "Onew", "TOUGH LOVE", 2026],
  ["X, Oh Why?", "Onew", "TOUGH LOVE", 2026],
  ["Chase", "Minho", "CHASE", 2022],
  ["Runaway (feat. GEMINI)", "Minho", "CHASE", 2022],
  ["Prove It", "Minho", "CHASE", 2022],
  ["Waterfall (feat. Lim Kim)", "Minho", "CHASE", 2022],
  ["Choice", "Minho", "CHASE", 2022],
  ["Heartbreak", "Minho", "CHASE", 2022],
  ["Call Back", "Minho", "CALL BACK", 2024],
  ["Slow Down", "Minho", "CALL BACK", 2024],
  ["FIREWORKS (feat. Sohee of RIIZE)", "Minho", "CALL BACK", 2024],
  ["Came And Left Me", "Minho", "CALL BACK", 2024],
  ["Something About U", "Minho", "CALL BACK", 2024],
  ["Round Kick", "Minho", "CALL BACK", 2024],
  ["Affection", "Minho", "CALL BACK", 2024],
  ["I Don't Miss You", "Minho", "CALL BACK", 2024],
  ["Because Of You (feat. Ningning of aespa)", "Minho", "CALL BACK", 2024],
  ["Would You Mind", "Minho", "CALL BACK", 2024],
  ["TEMPO", "Minho", "TEMPO", 2025],
  ["You're Right", "Minho", "TEMPO", 2025],
  ["Flawless", "Minho", "Flawless", 2026],
  ["Sunkissed", "Minho", "Flawless", 2026],
  ["Make it hot", "Minho", "Make it hot", 2026],
  ["Crazy (Guilty Pleasure) (feat. IRON)", "Jonghyun", "BASE", 2015],
  ["Deja-Boo (feat. Zion.T)", "Jonghyun", "BASE", 2015],
  ["Hallelujah", "Jonghyun", "BASE", 2015],
  ["Love Belt (feat. Younha)", "Jonghyun", "BASE", 2015],
  ["Neon", "Jonghyun", "BASE", 2015],
  ["MONO-Drama", "Jonghyun", "BASE", 2015],
  ["Hitchhiking", "Jonghyun", "BASE", 2015],
  ["Beautiful Tonight", "Jonghyun", "BASE", 2015],
  ["End of a day", "Jonghyun", "Story Op.1", 2015],
  ["U & I", "Jonghyun", "Story Op.1", 2015],
  ["Like You", "Jonghyun", "Story Op.1", 2015],
  ["Diphylleia grayi", "Jonghyun", "Story Op.1", 2015],
  ["Happy Birthday", "Jonghyun", "Story Op.1", 2015],
  ["I'm Sorry", "Jonghyun", "Story Op.1", 2015],
  ["02_07", "Jonghyun", "Story Op.1", 2015],
  ["1 out of 100", "Jonghyun", "Story Op.1", 2015],
  ["Bolt", "Jonghyun", "Story Op.1", 2015],
  ["Fine", "Jonghyun", "Story Op.1", 2015],
  ["She Is", "Jonghyun", "She Is", 2016],
  ["White Girl", "Jonghyun", "She Is", 2016],
  ["Orbit", "Jonghyun", "She Is", 2016],
  ["Moon", "Jonghyun", "She Is", 2016],
  ["Aurora", "Jonghyun", "She Is", 2016],
  ["Dress Up", "Jonghyun", "She Is", 2016],
  ["Cocktail", "Jonghyun", "She Is", 2016],
  ["Red", "Jonghyun", "She Is", 2016],
  ["Suit Up", "Jonghyun", "She Is", 2016],
  ["Lonely (feat. Taeyeon)", "Jonghyun", "Story Op.2", 2017],
  ["1ntro", "Jonghyun", "Story Op.2", 2017],
  ["A Gloomy Clock", "Jonghyun", "Story Op.2", 2017],
  ["Surrender", "Jonghyun", "Story Op.2", 2017],
  ["Rewind", "Jonghyun", "Story Op.2", 2017],
  ["Blink", "Jonghyun", "Story Op.2", 2017],
  ["Fireplace", "Jonghyun", "Story Op.2", 2017],
  ["Our Season", "Jonghyun", "Story Op.2", 2017],
  ["Shinin'", "Jonghyun", "Poet | Artist", 2018],
  ["Only One You Need", "Jonghyun", "Poet | Artist", 2018],
  ["#Hashtag", "Jonghyun", "Poet | Artist", 2018],
  ["Grease", "Jonghyun", "Poet | Artist", 2018],
  ["Take The Dive", "Jonghyun", "Poet | Artist", 2018],
  ["Sightseeing", "Jonghyun", "Poet | Artist", 2018],
  ["Just For A Day", "Jonghyun", "Poet | Artist", 2018],
  ["I'm So Curious", "Jonghyun", "Poet | Artist", 2018],
  ["Sentimental", "Jonghyun", "Poet | Artist", 2018],
  ["Before Our Spring", "Jonghyun", "Poet | Artist", 2018],
  ["Intro", "3RACHA", "J: / 2017", 2017],
  ["Tik Tok", "3RACHA", "J: / 2017", 2017],
  ["Runner's High", "3RACHA", "J: / 2017", 2017],
  ["Don Quixote", "3RACHA", "J: / 2017", 2017],
  ["Eunseoki", "3RACHA", "J: / 2017", 2017],
  ["WOW", "3RACHA", "J: / 2017", 2017],
  ["NXT 2 U", "3RACHA", "J: / 2017", 2017],
  ["Shh", "3RACHA", "3Days", 2017],
  ["Three Little Dragons", "3RACHA", "3Days", 2017],
  ["Peer Pressure", "3RACHA", "3Days", 2017],
  ["Small Things", "3RACHA", "3Days", 2017],
  ["+. -", "3RACHA", "3Days", 2017],
  ["Domestic Banana", "3RACHA", "3Days", 2017],
  ["Become My Strength", "3RACHA", "3Days", 2017],
  ["Matryoshka", "3RACHA", "Horizon", 2017],
  ["Hoodie Season", "3RACHA", "Horizon", 2017],
  ["P.A.C.E.", "3RACHA", "Horizon", 2017],
  ["Broken Compass", "3RACHA", "Horizon", 2017],
  ["Placebo", "3RACHA", "Horizon", 2017],
  ["SCENE STEALERS", "3RACHA", "Horizon", 2017],
  ["Double Knot", "3RACHA", "Horizon", 2017],
  ["For You", "3RACHA", "Horizon", 2017],
  ["Start Line", "3RACHA", "Start Line", 2018],
  ["ZONE", "3RACHA", "ZONE", 2021],
  ["HEYDAY", "3RACHA", "HEYDAY", 2022],
  ["Ride or Die", "EVAN", "Ride or Die", 2026],
  ["Overflow", "EVAN", "Ride or Die", 2026],
  ["Not Enough", "EVAN", "Death of Me", 2026],
  ["Noise", "EVAN", "Death of Me", 2026],
  ["Death of Me", "EVAN", "Death of Me", 2026],
  ["Twilight", "EVAN", "Death of Me", 2026],
  ["Immature", "EVAN", "Death of Me", 2026],
  ["Intro : Walk the Line", "ENHYPEN", "BORDER : DAY ONE", 2020],
  ["Given-Taken", "ENHYPEN", "BORDER : DAY ONE", 2020],
  ["Let Me In (20 CUBE)", "ENHYPEN", "BORDER : DAY ONE", 2020],
  ["10 Months", "ENHYPEN", "BORDER : DAY ONE", 2020],
  ["Flicker", "ENHYPEN", "BORDER : DAY ONE", 2020],
  ["Intro : The Invitation", "ENHYPEN", "BORDER : CARNIVAL", 2021],
  ["Drunk-Dazed", "ENHYPEN", "BORDER : CARNIVAL", 2021],
  ["Fever", "ENHYPEN", "BORDER : CARNIVAL", 2021],
  ["Not For Sale", "ENHYPEN", "BORDER : CARNIVAL", 2021],
  ["Mixed Up", "ENHYPEN", "BORDER : CARNIVAL", 2021],
  ["Outro : The Wormhole", "ENHYPEN", "BORDER : CARNIVAL", 2021],
  ["Intro : Whiteout", "ENHYPEN", "DIMENSION : DILEMMA", 2021],
  ["Tamed-Dashed", "ENHYPEN", "DIMENSION : DILEMMA", 2021],
  ["Upper Side Dreamin'", "ENHYPEN", "DIMENSION : DILEMMA", 2021],
  ["Blessed-Cursed", "ENHYPEN", "DIMENSION : DILEMMA", 2021],
  ["Just a Little Bit", "ENHYPEN", "DIMENSION : DILEMMA", 2021],
  ["Blockbuster (feat. Yeonjun of TXT)", "ENHYPEN", "DIMENSION : DILEMMA", 2021],
  ["Attention, please!", "ENHYPEN", "DIMENSION : DILEMMA", 2021],
  ["Interlude : Question", "ENHYPEN", "DIMENSION : DILEMMA", 2021],
  ["Polaroid Love", "ENHYPEN", "DIMENSION : ANSWER", 2022],
  ["Outro : Day 2", "ENHYPEN", "DIMENSION : ANSWER", 2022],
  ["Walk the Line", "ENHYPEN", "MANIFESTO : DAY 1", 2022],
  ["Future Perfect (Pass the Mic)", "ENHYPEN", "MANIFESTO : DAY 1", 2022],
  ["ParadoXXX Invasion", "ENHYPEN", "MANIFESTO : DAY 1", 2022],
  ["TFW (That Feeling When)", "ENHYPEN", "MANIFESTO : DAY 1", 2022],
  ["SHOUT OUT", "ENHYPEN", "MANIFESTO : DAY 1", 2022],
  ["Foreshadow", "ENHYPEN", "MANIFESTO : DAY 1", 2022],
  ["Fate", "ENHYPEN", "DARK BLOOD", 2023],
  ["Bite Me", "ENHYPEN", "DARK BLOOD", 2023],
  ["Sacrifice (Eat Me Up)", "ENHYPEN", "DARK BLOOD", 2023],
  ["Chaconne", "ENHYPEN", "DARK BLOOD", 2023],
  ["Bills", "ENHYPEN", "DARK BLOOD", 2023],
  ["Karma", "ENHYPEN", "DARK BLOOD", 2023],
  ["Mortal", "ENHYPEN", "ORANGE BLOOD", 2023],
  ["Sweet Venom", "ENHYPEN", "ORANGE BLOOD", 2023],
  ["Still Monster", "ENHYPEN", "ORANGE BLOOD", 2023],
  ["Near to You", "ENHYPEN", "ORANGE BLOOD", 2023],
  ["Sweet Venom (English Ver.)", "ENHYPEN", "ORANGE BLOOD", 2023],
  ["Moonstruck", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["XO (Only If You Say Yes)", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["Amnesia", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["First Love", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["Blessed-Cursed (Remix)", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["Fatal Trouble", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["Hundred Broken Hearts", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["Brought The Heat Back", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["The Sin Unknown", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["Paranormal", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["Royalty", "ENHYPEN", "ROMANCE : UNTOLD", 2024],
  ["No Doubt", "ENHYPEN", "ROMANCE : UNTOLD -daydream-", 2024],
  ["Daydream", "ENHYPEN", "ROMANCE : UNTOLD -daydream-", 2024],
  ["Awakening", "ENHYPEN", "DESIRE : UNLEASH", 2025],
  ["Burning Up", "ENHYPEN", "DESIRE : UNLEASH", 2025],
  ["Desire", "ENHYPEN", "DESIRE : UNLEASH", 2025],
  ["Shadowplay", "ENHYPEN", "DESIRE : UNLEASH", 2025],
  ["Runaway Heart", "ENHYPEN", "DESIRE : UNLEASH", 2025],
  ["Ignite", "ENHYPEN", "DESIRE : UNLEASH", 2025],
  ["Pulse", "ENHYPEN", "DESIRE : UNLEASH", 2025],
  ["Nightfall", "ENHYPEN", "DESIRE : UNLEASH", 2025],
  ["Ascension", "ENHYPEN", "DESIRE : UNLEASH", 2025],
  ["Knife", "ENHYPEN", "The Sin: Vanish", 2026],
  ["The Beginning", "ENHYPEN", "The Sin: Vanish", 2026],
  ["No Way Back (feat. So! YoON!)", "ENHYPEN", "The Sin: Vanish", 2026],
  ["The Fugitives", "ENHYPEN", "The Sin: Vanish", 2026],
  ["Stealer", "ENHYPEN", "The Sin: Vanish", 2026],
  ["The Voice", "ENHYPEN", "The Sin: Vanish", 2026],
  ["Witnesses", "ENHYPEN", "The Sin: Vanish", 2026],
  ["Big Girls Don't Cry", "ENHYPEN", "The Sin: Vanish", 2026],
  ["Lost Island", "ENHYPEN", "The Sin: Vanish", 2026],
  ["Sleep Tight", "ENHYPEN", "The Sin: Vanish", 2026],
  ["Bloody Paradise", "ENHYPEN", "THE SIN : BLISS", 2026],
  ["Bliss", "ENHYPEN", "THE SIN : BLISS", 2026],
  ["Shattered", "ENHYPEN", "THE SIN : BLISS", 2026],
  ["Eclipse", "ENHYPEN", "THE SIN : BLISS", 2026],
  ["Rescue", "ENHYPEN", "THE SIN : BLISS", 2026],
  ["Echo", "ENHYPEN", "THE SIN : BLISS", 2026],
  ["Paradox", "ENHYPEN", "THE SIN : BLISS", 2026],
  ["Sanctuary", "ENHYPEN", "THE SIN : BLISS", 2026],
  ["Illusion", "ENHYPEN", "THE SIN : BLISS", 2026],
  ["Always", "ENHYPEN", "THE SIN : BLISS", 2026],
  ["Given-Taken (Japanese Ver.)", "ENHYPEN", "BORDER : Hakanai", 2021],
  ["Let Me In (20 CUBE) (Japanese Ver.)", "ENHYPEN", "BORDER : Hakanai", 2021],
  ["Forget Me Not", "ENHYPEN", "BORDER : Hakanai", 2021],
  ["Tamed-Dashed (Japanese Ver.)", "ENHYPEN", "DIMENSION : SENKOU", 2022],
  ["Drunk-Dazed (Japanese Ver.)", "ENHYPEN", "DIMENSION : SENKOU", 2022],
  ["Future Perfect (Pass the MIC) (Japanese Ver.)", "ENHYPEN", "SADAME", 2022],
  ["Blessed-Cursed (Japanese Ver.)", "ENHYPEN", "SADAME", 2022],
  ["Make the change", "ENHYPEN", "SADAME", 2022],
  ["Bite Me (Japanese Ver.)", "ENHYPEN", "結 -YOU-", 2023],
  ["Bills (Japanese Ver.)", "ENHYPEN", "結 -YOU-", 2023],
  ["BLOSSOM", "ENHYPEN", "結 -YOU-", 2023],
  ["#Cookie Jar", "Red Velvet", "#Cookie Jar", 2018],
  ["Aitai-tai", "Red Velvet", "#Cookie Jar", 2018],
  ["Russian Roulette (Japanese Ver.)", "Red Velvet", "#Cookie Jar", 2018],
  ["SAPPY", "Red Velvet", "SAPPY", 2019],
  ["Sayonara", "Red Velvet", "SAPPY", 2019],
  ["Power Up (Japanese Ver.)", "Red Velvet", "SAPPY", 2019],
  ["Wildside", "Red Velvet", "BLOOM", 2022],
  ["Marionette", "Red Velvet", "BLOOM", 2022],
  ["Jackpot", "Red Velvet", "BLOOM", 2022],
  ["How u doin'", "Twice", "&TWICE", 2019],
  ["PIECE OF CANDY", "Twice", "Perfect World", 2021],
  ["Drink It Up", "Twice", "Celebrate", 2022],
  ["Bouquet", "Twice", "Celebrate", 2022],
  ["Northstar", "Twice", "Celebrate", 2022],
  ["Dive", "Twice", "Dive", 2024],
  ["Beyond the Horizon", "Twice", "Dive", 2024],
  ["Ocean Deep", "Twice", "Dive", 2024],
  ["Love War", "Twice", "Dive", 2024],
  ["Inside of Me", "Twice", "Dive", 2024],
  ["Echoes of Heart", "Twice", "Dive", 2024],
  ["Drama (Japanese Ver.)", "TXT", "DRAMA", 2020],
  ["Blue Hour (Japanese Ver.)", "TXT", "STILL DREAMING", 2021],
  ["Run Away (Japanese Ver.)", "TXT", "STILL DREAMING", 2021],
  ["Crown (Japanese Ver.)", "TXT", "STILL DREAMING", 2021],
  ["Angel or Devil (Japanese Ver.)", "TXT", "STILL DREAMING", 2021],
  ["Can't You See Me? (Japanese Ver.)", "TXT", "STILL DREAMING", 2021],
  ["Zero fuerzas (0X1=LOVESONG Japanese Ver.)", "TXT", "Chaotic Wonderland", 2021],
  ["MOA Diary (Dubaddu Wari Wari) (Japanese Ver.)", "TXT", "Chaotic Wonderland", 2021],
  ["Loser=Lover (Japanese Ver.)", "TXT", "Chaotic Wonderland", 2021],
  ["Intro : Daydream", "TXT", "SWEET", 2023],
  ["Sugar Rush Ride (Japanese Ver.)", "TXT", "SWEET", 2023],
  ["Good Boy Gone Bad (Japanese Ver.)", "TXT", "SWEET", 2023],
  ["Hitori Juppun", "TXT", "SWEET", 2023],
  ["Ccsum", "TXT", "SWEET", 2023],
  ["Magic Island (Japanese Ver.)", "TXT", "SWEET", 2023],
  ["Boy With Luv (Japanese Ver.)", "TXT", "SWEET", 2023],
  ["Outro : Falling", "TXT", "SWEET", 2023],
  ["God's Menu (Japanese Ver.)", "Stray Kids", "ALL IN", 2020],
  ["Back Door (Japanese Ver.)", "Stray Kids", "ALL IN", 2020],
  ["Top (Japanese Ver.)", "Stray Kids", "ALL IN", 2020],
  ["Slump (Japanese Ver.)", "Stray Kids", "ALL IN", 2020],
  ["Venom (Japanese Ver.)", "Stray Kids", "CIRCUS", 2022],
  ["Maniac (Japanese Ver.)", "Stray Kids", "CIRCUS", 2022],
  ["Silent Cry (Japanese Ver.)", "Stray Kids", "CIRCUS", 2022],
  ["Battle Ground", "Stray Kids", "The Sound", 2023],
  ["Lost Me", "Stray Kids", "The Sound", 2023],
  ["Case 143 (Japanese Ver.)", "Stray Kids", "The Sound", 2023],
  ["Chill (Japanese Ver.)", "Stray Kids", "The Sound", 2023],
  ["Scars", "Stray Kids", "The Sound", 2023],
  ["The View (Japanese Ver.)", "Stray Kids", "The Sound", 2023],
  ["Super Bowl (Japanese Ver.)", "Stray Kids", "The Sound", 2023],
  ["Topline (feat. Tiger JK)", "Stray Kids", "5-STAR", 2023],
  ["The Sound (Korean Ver.)", "Stray Kids", "5-STAR", 2023],
  ["Jelly Walker", "Stray Kids", "ATE", 2024],
  ["Intermission", "Stray Kids", "ATE", 2024],
  ["In the Dark", "Stray Kids", "ATE", 2024],
  ["Youth", "Stray Kids", "ATE", 2024],
  ["Christmas Love", "Stray Kids", "GIANT", 2024],
  ["U (feat. Tablo)", "Stray Kids", "SKZHOP HIPTAPE - HOP", 2024],
  ["Walkin On Water (Hiphop Ver.)", "Stray Kids", "SKZHOP HIPTAPE - HOP", 2024],
  ["Muted", "Stray Kids", "SKZHOP HIPTAPE - HOP", 2024],
  ["So Good", "Stray Kids", "SKZHOP HIPTAPE - HOP", 2024],
  ["Apocalypse", "Stray Kids", "KARMA", 2025],
  ["Fever", "Stray Kids", "KARMA", 2025],
  ["Wildfire", "Stray Kids", "KARMA", 2025],
  ["DOMINO EFFECT", "Stray Kids", "DOMINO EFFECT", 2025],
  ["Run and Hide", "Stray Kids", "DOMINO EFFECT", 2025],
  ["Pulse", "Stray Kids", "DOMINO EFFECT", 2025],
  ["Divine", "Stray Kids", "SKZ IT TAPE: DO IT", 2025],
  ["Holiday", "Stray Kids", "SKZ IT TAPE: DO IT", 2025],
  ["Photobook", "Stray Kids", "SKZ IT TAPE: DO IT", 2025],
  ["Do It (Festival Version)", "Stray Kids", "SKZ IT TAPE: DO IT", 2025],
  ["RUN IT", "Stray Kids", "THIS & THAT", 2026],
  ["After You", "Stray Kids", "THIS & THAT", 2026],
  ["FARMING", "Stray Kids", "THIS & THAT", 2026],
  ["The Way to Me (Intro)", "fromis_9", "To. Heart", 2018],
  ["To Heart", "fromis_9", "To. Heart", 2018],
  ["Miracle", "fromis_9", "To. Heart", 2018],
  ["Pinocchio", "fromis_9", "To. Heart", 2018],
  ["Be With You", "fromis_9", "To. Heart", 2018],
  ["Glass Shoes (MAMA ver.)", "fromis_9", "To. Heart", 2018],
  ["Close To You", "fromis_9", "To. Day", 2018],
  ["Think of You", "fromis_9", "To. Day", 2018],
  ["DKDK (Pit-a-pat)", "fromis_9", "To. Day", 2018],
  ["22Century Girl", "fromis_9", "To. Day", 2018],
  ["Clover", "fromis_9", "To. Day", 2018],
  ["First Love", "fromis_9", "To. Day", 2018],
  ["LOVE BOMB", "fromis_9", "From.9", 2018],
  ["Dancing Queen", "fromis_9", "From.9", 2018],
  ["Coloring", "fromis_9", "From.9", 2018],
  ["FUN!", "fromis_9", "FUN FACTORY", 2019],
  ["Love Rumpumpum", "fromis_9", "FUN FACTORY", 2019],
  ["Fly High", "fromis_9", "FUN FACTORY", 2019],
  ["Feel Good (SECRET CODE)", "fromis_9", "My Little Society", 2020],
  ["Weather", "fromis_9", "My Little Society", 2020],
  ["Starry Night", "fromis_9", "My Little Society", 2020],
  ["Somebody to Love", "fromis_9", "My Little Society", 2020],
  ["Fish", "fromis_9", "My Little Society", 2020],
  ["Airplane Mode", "fromis_9", "9 WAY TICKET", 2021],
  ["WE GO", "fromis_9", "9 WAY TICKET", 2021],
  ["Promise", "fromis_9", "9 WAY TICKET", 2021],
  ["Talk & Talk", "fromis_9", "Talk & Talk", 2021],
  ["Escape Room", "fromis_9", "Midnight Guest", 2022],
  ["DM", "fromis_9", "Midnight Guest", 2022],
  ["Love Is Around", "fromis_9", "Midnight Guest", 2022],
  ["Hush Hush", "fromis_9", "Midnight Guest", 2022],
  ["0g", "fromis_9", "Midnight Guest", 2022],
  ["Up And", "fromis_9", "from our Memento Box", 2022],
  ["Stay This Way", "fromis_9", "from our Memento Box", 2022],
  ["Blind Letter", "fromis_9", "from our Memento Box", 2022],
  ["Cheese", "fromis_9", "from our Memento Box", 2022],
  ["Rewind", "fromis_9", "from our Memento Box", 2022],
  ["Attitude", "fromis_9", "Unlock My World", 2023],
  ["#menow", "fromis_9", "Unlock My World", 2023],
  ["Wishlist", "fromis_9", "Unlock My World", 2023],
  ["In the Mirror", "fromis_9", "Unlock My World", 2023],
  ["Don't Care", "fromis_9", "Unlock My World", 2023],
  ["Prom Night", "fromis_9", "Unlock My World", 2023],
  ["Bring It On", "fromis_9", "Unlock My World", 2023],
  ["What I Want", "fromis_9", "Unlock My World", 2023],
  ["My Night Routine", "fromis_9", "Unlock My World", 2023],
  ["Eye Contact", "fromis_9", "Unlock My World", 2023],
  ["Supersonic", "fromis_9", "Supersonic", 2024],
  ["Beat the Heat", "fromis_9", "Supersonic", 2024],
  ["Take A Chance", "fromis_9", "Supersonic", 2024],
  ["LIKE YOU BETTER", "fromis_9", "From Our 20's", 2025],
  ["REBELUTIONAL", "fromis_9", "From Our 20's", 2025],
  ["Love=Disaster", "fromis_9", "From Our 20's", 2025],
  ["Strawberry Mimosa", "fromis_9", "From Our 20's", 2025],
  ["Twisted Love", "fromis_9", "From Our 20's", 2025],
  ["Merry Go Round", "fromis_9", "From Our 20's", 2025],
  ["LIKE YOU BETTER (Japanese ver.)", "fromis_9", "LIKE YOU BETTER (Japanese ver.) - EP", 2026],
  ["Love=Disaster (Japanese ver.)", "fromis_9", "LIKE YOU BETTER (Japanese ver.) - EP", 2026],
  ["Sky Runner", "fromis_9", "LIKE YOU BETTER (Japanese ver.) - EP", 2026],
  ["Vitamin ME", "fromis_9", "Glow ME", 2026],
  ["Pocket Treat", "fromis_9", "Glow ME", 2026],
  ["Blue Heart", "fromis_9", "Glow ME", 2026],
  ["Screen Time", "fromis_9", "Glow ME", 2026],
  ["Teacher", "fromis_9", "Glow ME", 2026],
  ["Cold Blood", "fromis_9", "Glow ME", 2026],
  ["Why do I cry?", "fromis_9", "Glow ME", 2026],
  ["Day 1", "fromis_9", "Glow ME", 2026],
  ["Wonderland", "fromis_9", "Glow ME", 2026],
  ["Black Mamba", "aespa", "Black Mamba", 2020],
  ["Forever", "aespa", "Forever", 2021],
  ["Next Level", "aespa", "Next Level", 2021],
  ["aenergy", "aespa", "Savage", 2021],
  ["Savage", "aespa", "Savage", 2021],
  ["I'll Make You Cry", "aespa", "Savage", 2021],
  ["YEPPI YEPPI", "aespa", "Savage", 2021],
  ["ICONIC", "aespa", "Savage", 2021],
  ["Lucid Dream", "aespa", "Savage", 2021],
  ["Dreams Come True", "aespa", "Dreams Come True", 2021],
  ["Girls", "aespa", "Girls", 2022],
  ["Illusion", "aespa", "Girls", 2022],
  ["Lingo", "aespa", "Girls", 2022],
  ["Life's Too Short", "aespa", "Girls", 2022],
  ["ICU", "aespa", "Girls", 2022],
  ["Life's Too Short (English Ver.)", "aespa", "Girls", 2022],
  ["Better Things", "aespa", "Better Things", 2023],
  ["Welcome to MY World (feat. naevis)", "aespa", "MY WORLD", 2023],
  ["Spicy", "aespa", "MY WORLD", 2023],
  ["Salty & Sweet", "aespa", "MY WORLD", 2023],
  ["Thirsty", "aespa", "MY WORLD", 2023],
  ["I'm Unhappy", "aespa", "MY WORLD", 2023],
  ["'Til We Meet Again", "aespa", "MY WORLD", 2023],
  ["Drama", "aespa", "Drama", 2023],
  ["Trick or Trick", "aespa", "Drama", 2023],
  ["Don't Blink", "aespa", "Drama", 2023],
  ["Hot Air Balloon", "aespa", "Drama", 2023],
  ["YOLO", "aespa", "Drama", 2023],
  ["You", "aespa", "Drama", 2023],
  ["Supernova", "aespa", "Armageddon", 2024],
  ["Armageddon", "aespa", "Armageddon", 2024],
  ["Set The Tone", "aespa", "Armageddon", 2024],
  ["Mine", "aespa", "Armageddon", 2024],
  ["Licorice", "aespa", "Armageddon", 2024],
  ["BAHAMA", "aespa", "Armageddon", 2024],
  ["Long Chat", "aespa", "Armageddon", 2024],
  ["Prologue", "aespa", "Armageddon", 2024],
  ["Live My Life", "aespa", "Armageddon", 2024],
  ["Melody", "aespa", "Armageddon", 2024],
  ["Hot Mess", "aespa", "Hot Mess", 2024],
  ["Sun and Moon", "aespa", "Hot Mess", 2024],
  ["ZOOM ZOOM", "aespa", "Hot Mess", 2024],
  ["Whiplash", "aespa", "Whiplash", 2024],
  ["Kill It", "aespa", "Whiplash", 2024],
  ["Flights, Not Feelings", "aespa", "Whiplash", 2024],
  ["Pink Hoodie", "aespa", "Whiplash", 2024],
  ["Flowers", "aespa", "Whiplash", 2024],
  ["Just Another Girl", "aespa", "Whiplash", 2024],
  ["Rich Man", "aespa", "Rich Man", 2025],
  ["Drift", "aespa", "Rich Man", 2025],
  ["Bubble", "aespa", "Rich Man", 2025],
  ["Count On Me", "aespa", "Rich Man", 2025],
  ["Angel #48", "aespa", "Rich Man", 2025],
  ["To The Girls", "aespa", "Rich Man", 2025],
  ["LEMONADE", "aespa", "LEMONADE", 2026],
  ["Switchblade (feat. Ty Dolla Sign)", "aespa", "LEMONADE", 2026],
  ["Neon Light", "aespa", "LEMONADE", 2026],
  ["Drive", "aespa", "LEMONADE", 2026],
  ["KISS N TELL", "aespa", "KISS N TELL", 2026],
  ["Orbit Pop", "aespa", "KISS N TELL", 2026],
  ["Fangirl", "aespa", "KISS N TELL", 2026],
  ["ATTITUDE", "aespa", "KISS N TELL", 2026],
  ["Done with Rule", "aespa", "KISS N TELL", 2026],
  ["In Halo", "aespa", "KISS N TELL", 2026],
  ["Formula", "ALPHADRIVEONE", "EUPHORIA", 2025],
  ["Freak Alarm", "ALPHADRIVEONE", "EUPHORIA", 2026],
  ["Raw Flame", "ALPHADRIVEONE", "EUPHORIA", 2026],
  ["Chains", "ALPHADRIVEONE", "EUPHORIA", 2026],
  ["Never Been 2 Heaven", "ALPHADRIVEONE", "EUPHORIA", 2026],
  ["Cinnamon Shake", "ALPHADRIVEONE", "EUPHORIA", 2026],
  ["Born Dire", "ALPHADRIVEONE", "Unbreakable: Beast", 2026],
  ["Diamond Hour", "ALPHADRIVEONE", "Unbreakable: Beast", 2026],
  ["One More Time", "ALPHADRIVEONE", "Unbreakable: Beast", 2026],
  ["Talk to Me", "ALPHADRIVEONE", "Unbreakable: Beast", 2026],
  ["OMG!", "ALPHADRIVEONE", "Unbreakable: Beast", 2026],
  ["Good Life", "ALPHADRIVEONE", "Unbreakable: Beast", 2026],
  ["Welcome Home", "ALPHADRIVEONE", "Unbreakable: Beast", 2026],
  ["Go! Go!", "ALPHADRIVEONE", "Agent Kim Reactivated OST", 2026],
  ["The Little Star (Intro)", "AHOF", "WHO WE ARE", 2025],
  ["The Universe", "AHOF", "WHO WE ARE", 2025],
  ["Rendezvous", "AHOF", "WHO WE ARE", 2025],
  ["Incompleted", "AHOF", "WHO WE ARE", 2025],
  ["Cosmic Underdog", "AHOF", "WHO WE ARE", 2025],
  ["AHOF (Outro)", "AHOF", "WHO WE ARE", 2025],
  ["Mamma Mia (Who We Are) (AHOF Ver.)", "AHOF", "WHO WE ARE", 2025],
  ["Butterfly (AHOF Ver.)", "AHOF", "WHO WE ARE", 2025],
  ["Ignition (AHOF Ver.)", "AHOF", "WHO WE ARE", 2025],
  ["Everything is Love (Intro)", "AHOF", "The Passage", 2025],
  ["Run at 1.5x Speed", "AHOF", "The Passage", 2025],
  ["Pinocchio", "AHOF", "The Passage", 2025],
  ["Never Lose You", "AHOF", "The Passage", 2025],
  ["The Sleeping Diary (Outro)", "AHOF", "The Passage", 2025],
  ["Run to You", "AHOF", "RUN TO YOU", 2026],
  ["Sugar High", "AHOF", "RUN TO YOU", 2026],
  ["Just Say Yes", "AHOF", "RUN TO YOU", 2026],
  ["You're the Reason", "AHOF", "RUN TO YOU", 2026],
  ["Our Story", "AHOF", "RUN TO YOU", 2026],
  ["Intro : Long Journey", "ATEEZ", "TREASURE EP.1 : All To Zero", 2018],
  ["Pirate King", "ATEEZ", "TREASURE EP.1 : All To Zero", 2018],
  ["Treasure", "ATEEZ", "TREASURE EP.1 : All To Zero", 2018],
  ["Twilight", "ATEEZ", "TREASURE EP.1 : All To Zero", 2018],
  ["Stay", "ATEEZ", "TREASURE EP.1 : All To Zero", 2018],
  ["My Way", "ATEEZ", "TREASURE EP.1 : All To Zero", 2018],
  ["HALA HALA", "ATEEZ", "TREASURE EP.2 : Zero To One", 2019],
  ["Say My Name", "ATEEZ", "TREASURE EP.2 : Zero To One", 2019],
  ["Desire", "ATEEZ", "TREASURE EP.2 : Zero To One", 2019],
  ["Light", "ATEEZ", "TREASURE EP.2 : Zero To One", 2019],
  ["Promise", "ATEEZ", "TREASURE EP.2 : Zero To One", 2019],
  ["From", "ATEEZ", "TREASURE EP.2 : Zero To One", 2019],
  ["UTOPIA", "ATEEZ", "TREASURE EP.3 : One To All", 2019],
  ["ILLUSION", "ATEEZ", "TREASURE EP.3 : One To All", 2019],
  ["Crescent", "ATEEZ", "TREASURE EP.3 : One To All", 2019],
  ["WAVE", "ATEEZ", "TREASURE EP.3 : One To All", 2019],
  ["AURORA", "ATEEZ", "TREASURE EP.3 : One To All", 2019],
  ["Dancing Like Butterfly Wings", "ATEEZ", "TREASURE EP.3 : One To All", 2019],
  ["End of the Beginning", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["WONDERLAND", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["Dazzling Light", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["Mist", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["Precious (Overture)", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["WIN", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["If Without You", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["Thank U", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["Sunrise", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["With U", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["Beginning of the End", "ATEEZ", "TREASURE EP.FIN : All To Action", 2019],
  ["Answer", "ATEEZ", "TREASURE EPILOGUE : Action To Answer", 2020],
  ["Horizon", "ATEEZ", "TREASURE EPILOGUE : Action To Answer", 2020],
  ["Star 1117", "ATEEZ", "TREASURE EPILOGUE : Action To Answer", 2020],
  ["Precious", "ATEEZ", "TREASURE EPILOGUE : Action To Answer", 2020],
  ["Outro : Long Journey", "ATEEZ", "TREASURE EPILOGUE : Action To Answer", 2020],
  ["Pirate King (Japanese Ver.)", "ATEEZ", "Into the A to Z", 2021],
  ["Say My Name (Japanese Ver.)", "ATEEZ", "Into the A to Z", 2021],
  ["Utopia (Japanese Ver.)", "ATEEZ", "Into the A to Z", 2021],
  ["Aurora (Japanese Ver.)", "ATEEZ", "Into the A to Z", 2021],
  ["Wonderland (Japanese Ver.)", "ATEEZ", "Into the A to Z", 2021],
  ["Answer (Japanese Ver.)", "ATEEZ", "Into the A to Z", 2021],
  ["Better", "ATEEZ", "Into the A to Z", 2021],
  ["Thanxx (Japanese Ver.)", "ATEEZ", "Into the A to Z", 2021],
  ["Inception (Japanese Ver.)", "ATEEZ", "Into the A to Z", 2021],
  ["Dear Diary : 2016.07.29", "ATEEZ", "ZERO : FEVER Part.1", 2020],
  ["FEVER", "ATEEZ", "ZERO : FEVER Part.1", 2020],
  ["THANXX", "ATEEZ", "ZERO : FEVER Part.1", 2020],
  ["To The Beat", "ATEEZ", "ZERO : FEVER Part.1", 2020],
  ["INCEPTION", "ATEEZ", "ZERO : FEVER Part.1", 2020],
  ["Good Lil Boy", "ATEEZ", "ZERO : FEVER Part.1", 2020],
  ["One Day At A Time", "ATEEZ", "ZERO : FEVER Part.1", 2020],
  ["Fireworks (I'm The One)", "ATEEZ", "ZERO : FEVER Part.2", 2021],
  ["The Leaders", "ATEEZ", "ZERO : FEVER Part.2", 2021],
  ["Time Of Love", "ATEEZ", "ZERO : FEVER Part.2", 2021],
  ["Take Me Home", "ATEEZ", "ZERO : FEVER Part.2", 2021],
  ["Celebrate", "ATEEZ", "ZERO : FEVER Part.2", 2021],
  ["Take Me Home (English Ver.)", "ATEEZ", "ZERO : FEVER Part.2", 2021],
  ["I'm The One (HEAT-TOPPING Ver.)", "ATEEZ", "ZERO : FEVER Part.2", 2021],
  ["Dreamers", "ATEEZ", "Dreamers", 2021],
  ["Blue Summer", "ATEEZ", "Dreamers", 2021],
  ["Still Here (Acoustic Ver.)", "ATEEZ", "Dreamers", 2021],
  ["Eternal Sunshine", "ATEEZ", "ZERO : FEVER Part.3", 2021],
  ["Feeling Like I Do", "ATEEZ", "ZERO : FEVER Part.3", 2021],
  ["Deja Vu", "ATEEZ", "ZERO : FEVER Part.3", 2021],
  ["ROCKY", "ATEEZ", "ZERO : FEVER Part.3", 2021],
  ["All About You", "ATEEZ", "ZERO : FEVER Part.3", 2021],
  ["Not Too Late", "ATEEZ", "ZERO : FEVER Part.3", 2021],
  ["Turbulence", "ATEEZ", "ZERO : FEVER EPILOGUE", 2021],
  ["Be With You", "ATEEZ", "ZERO : FEVER EPILOGUE", 2021],
  ["The Letter", "ATEEZ", "ZERO : FEVER EPILOGUE", 2021],
  ["Still Here (Korean Ver.)", "ATEEZ", "ZERO : FEVER EPILOGUE", 2021],
  ["Better (Korean Ver.)", "ATEEZ", "ZERO : FEVER EPILOGUE", 2021],
  ["The Real", "ATEEZ", "ZERO : FEVER EPILOGUE", 2021],
  ["WAVE (Overture)", "ATEEZ", "ZERO : FEVER EPILOGUE", 2021],
  ["WONDERLAND (Symphony No.9)", "ATEEZ", "ZERO : FEVER EPILOGUE", 2021],
  ["Answer (Ode to Joy) (feat. LA POEM)", "ATEEZ", "ZERO : FEVER EPILOGUE", 2021],
  ["Outro : Over the Horizon", "ATEEZ", "ZERO : FEVER EPILOGUE", 2021],
  ["Intro (BEYOND : ZERO)", "ATEEZ", "BEYOND : ZERO", 2022],
  ["Deja Vu (Japanese Ver.)", "ATEEZ", "BEYOND : ZERO", 2022],
  ["ROCKY (Boxers Ver.)", "ATEEZ", "BEYOND : ZERO", 2022],
  ["The King", "ATEEZ", "BEYOND : ZERO", 2022],
  ["Turbulence (Japanese Ver.)", "ATEEZ", "BEYOND : ZERO", 2022],
  ["Take Me Home (Japanese Ver.)", "ATEEZ", "BEYOND : ZERO", 2022],
  ["Fireworks (I'm The One) (Japanese Ver.)", "ATEEZ", "BEYOND : ZERO", 2022],
  ["PROPAGANDA", "ATEEZ", "THE WORLD EP.1 : MOVEMENT", 2022],
  ["Sector 1", "ATEEZ", "THE WORLD EP.1 : MOVEMENT", 2022],
  ["Cyberpunk", "ATEEZ", "THE WORLD EP.1 : MOVEMENT", 2022],
  ["Guerrilla", "ATEEZ", "THE WORLD EP.1 : MOVEMENT", 2022],
  ["The Ring", "ATEEZ", "THE WORLD EP.1 : MOVEMENT", 2022],
  ["WDIG", "ATEEZ", "THE WORLD EP.1 : MOVEMENT", 2022],
  ["New World", "ATEEZ", "THE WORLD EP.1 : MOVEMENT", 2022],
  ["HALAZIA", "ATEEZ", "SPIN OFF : FROM THE WITNESS", 2022],
  ["WIN (June One Remix)", "ATEEZ", "SPIN OFF : FROM THE WITNESS", 2022],
  ["I'm The One (Eden-ary Remix)", "ATEEZ", "SPIN OFF : FROM THE WITNESS", 2022],
  ["Take Me Home (IDIOTAPE Remix)", "ATEEZ", "SPIN OFF : FROM THE WITNESS", 2022],
  ["Outro : Blue Bird", "ATEEZ", "SPIN OFF : FROM THE WITNESS", 2022],
  ["This World", "ATEEZ", "THE WORLD EP.2 : OUTLAW", 2023],
  ["Dune", "ATEEZ", "THE WORLD EP.2 : OUTLAW", 2023],
  ["BOUNCY", "ATEEZ", "THE WORLD EP.2 : OUTLAW", 2023],
  ["DJANGO", "ATEEZ", "THE WORLD EP.2 : OUTLAW", 2023],
  ["Wake Up", "ATEEZ", "THE WORLD EP.2 : OUTLAW", 2023],
  ["Outlaw", "ATEEZ", "THE WORLD EP.2 : OUTLAW", 2023],
  ["Intro : Siren", "ATEEZ", "THE WORLD EP.PARADIGM", 2023],
  ["Paradigm", "ATEEZ", "THE WORLD EP.PARADIGM", 2023],
  ["Cyberpunk (Japanese Ver.)", "ATEEZ", "THE WORLD EP.PARADIGM", 2023],
  ["Guerrilla (Flag Ver.)", "ATEEZ", "THE WORLD EP.PARADIGM", 2023],
  ["New World (Japanese Ver.)", "ATEEZ", "THE WORLD EP.PARADIGM", 2023],
  ["Outro : Liberty", "ATEEZ", "THE WORLD EP.PARADIGM", 2023],
  ["WE KNOW", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["Emergency", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["Crazy Form", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["ARRIBA", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["Silver Light", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["Crescent Part.2", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["Dreamy Day", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["MATZ", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["IT's You", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["Youth", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["Everything", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["FIN : WILL", "ATEEZ", "THE WORLD EP.FIN : WILL", 2023],
  ["Not Okay", "ATEEZ", "NOT OKAY", 2024],
  ["Days", "ATEEZ", "NOT OKAY", 2024],
  ["Golden Hour", "ATEEZ", "GOLDEN HOUR : Part.1", 2024],
  ["Blind", "ATEEZ", "GOLDEN HOUR : Part.1", 2024],
  ["WORK", "ATEEZ", "GOLDEN HOUR : Part.1", 2024],
  ["Empty Box", "ATEEZ", "GOLDEN HOUR : Part.1", 2024],
  ["Shaboom", "ATEEZ", "GOLDEN HOUR : Part.1", 2024],
  ["Siren", "ATEEZ", "GOLDEN HOUR : Part.1", 2024],
  ["Birthday", "ATEEZ", "Birthday", 2024],
  ["Royal", "ATEEZ", "Birthday", 2024],
  ["Forevermore", "ATEEZ", "Birthday", 2024],
  ["DEEP DIVE", "ATEEZ", "GOLDEN HOUR : Part.2", 2024],
  ["Scene 1 : Value", "ATEEZ", "GOLDEN HOUR : Part.2", 2024],
  ["Ice On My Teeth", "ATEEZ", "GOLDEN HOUR : Part.2", 2024],
  ["Man on Fire", "ATEEZ", "GOLDEN HOUR : Part.2", 2024],
  ["Selfish Waltz", "ATEEZ", "GOLDEN HOUR : Part.2", 2024],
  ["Enough", "ATEEZ", "GOLDEN HOUR : Part.2", 2024],
  ["Lemon Drop", "ATEEZ", "GOLDEN HOUR : Part.3", 2025],
  ["Masterpiece", "ATEEZ", "GOLDEN HOUR : Part.3", 2025],
  ["Now this house ain't a home", "ATEEZ", "GOLDEN HOUR : Part.3", 2025],
  ["Castle", "ATEEZ", "GOLDEN HOUR : Part.3", 2025],
  ["Bridge : The Edge of Reality", "ATEEZ", "GOLDEN HOUR : Part.3", 2025],
  ["In Your Fantasy", "ATEEZ", "GOLDEN HOUR : Part.3 In Your Fantasy Edition", 2025],
  ["NO1", "ATEEZ", "GOLDEN HOUR : Part.3 In Your Fantasy Edition", 2025],
  ["Skin", "ATEEZ", "GOLDEN HOUR : Part.3 In Your Fantasy Edition", 2025],
  ["Slide to me", "ATEEZ", "GOLDEN HOUR : Part.3 In Your Fantasy Edition", 2025],
  ["Legacy", "ATEEZ", "GOLDEN HOUR : Part.3 In Your Fantasy Edition", 2025],
  ["Creep", "ATEEZ", "GOLDEN HOUR : Part.3 In Your Fantasy Edition", 2025],
  ["ROAR", "ATEEZ", "GOLDEN HOUR : Part.3 In Your Fantasy Edition", 2025],
  ["Sagittarius", "ATEEZ", "GOLDEN HOUR : Part.3 In Your Fantasy Edition", 2025],
  ["To be your light", "ATEEZ", "GOLDEN HOUR : Part.3 In Your Fantasy Edition", 2025],
  ["Ash", "ATEEZ", "Ashes to Light", 2025],
  ["12 Midnight", "ATEEZ", "Ashes to Light", 2025],
  ["Tippy Toes", "ATEEZ", "Ashes to Light", 2025],
  ["FACE", "ATEEZ", "Ashes to Light", 2025],
  ["Crescendo", "ATEEZ", "Ashes to Light", 2025],
  ["Ghost", "ATEEZ", "GOLDEN HOUR : Part.4", 2026],
  ["Adrenaline", "ATEEZ", "GOLDEN HOUR : Part.4", 2026],
  ["NASA", "ATEEZ", "GOLDEN HOUR : Part.4", 2026],
  ["On The Road", "ATEEZ", "GOLDEN HOUR : Part.4", 2026],
  ["Choose", "ATEEZ", "GOLDEN HOUR : Part.4", 2026],
  ["BAD", "ATEEZ", "GOLDEN HOUR : Part.5", 2026],
  ["MAMACITA", "ATEEZ", "GOLDEN HOUR : Part.5", 2026],
  ["TOXIN", "ATEEZ", "GOLDEN HOUR : Part.5", 2026],
  ["Fallin'", "ATEEZ", "GOLDEN HOUR : Part.5", 2026],
  ["Body", "ATEEZ", "GOLDEN HOUR : Part.5", 2026],
  ["BAD (Japanese Ver.)", "ATEEZ", "BAD (Japanese Ver.)", 2026],
  ["Seeker", "ATEEZ", "BAD (Japanese Ver.)", 2026],
  ["HIGHER", "ATEEZ", "BAD (Japanese Ver.)", 2026],
  ["Ok! Ready (Intro)", "ASTRO", "Spring Up", 2016],
  ["Hide & Seek", "ASTRO", "Spring Up", 2016],
  ["Innocent Love", "ASTRO", "Spring Up", 2016],
  ["Morning Call", "ASTRO", "Spring Up", 2016],
  ["Cat's Eye", "ASTRO", "Spring Up", 2016],
  ["Fireworks", "ASTRO", "Summer Vibes", 2016],
  ["Breathless", "ASTRO", "Summer Vibes", 2016],
  ["Growing Pains", "ASTRO", "Summer Vibes", 2016],
  ["Polaris", "ASTRO", "Summer Vibes", 2016],
  ["My Style", "ASTRO", "Summer Vibes", 2016],
  ["Breathless (Acoustic Ver.)", "ASTRO", "Summer Vibes", 2016],
  ["Lonely", "ASTRO", "Autumn Story", 2016],
  ["Confession", "ASTRO", "Autumn Story", 2016],
  ["Your Love", "ASTRO", "Autumn Story", 2016],
  ["Colored", "ASTRO", "Autumn Story", 2016],
  ["Star", "ASTRO", "Autumn Story", 2016],
  ["Should Have Held On", "ASTRO", "Winter Dream", 2017],
  ["Cotton Candy", "ASTRO", "Winter Dream", 2017],
  ["You & Me", "ASTRO", "Winter Dream", 2017],
  ["Dreams Come True", "ASTRO", "Dream Part.01", 2017],
  ["Baby", "ASTRO", "Dream Part.01", 2017],
  ["You Smile", "ASTRO", "Dream Part.01", 2017],
  ["Because It's You", "ASTRO", "Dream Part.01", 2017],
  ["Dream Night", "ASTRO", "Dream Part.01", 2017],
  ["I'll Be There", "ASTRO", "Dream Part.01", 2017],
  ["Lie", "ASTRO", "Dream Part.01", 2017],
  ["Every Minute", "ASTRO", "Dream Part.01", 2017],
  ["With You", "ASTRO", "Dream Part.02", 2017],
  ["Crazy Sexy Cool", "ASTRO", "Dream Part.02", 2017],
  ["Butterfly", "ASTRO", "Dream Part.02", 2017],
  ["Run", "ASTRO", "Dream Part.02", 2017],
  ["Better With You", "ASTRO", "Dream Part.02", 2017],
  ["Always You", "ASTRO", "Rise Up", 2018],
  ["By Your Side", "ASTRO", "Rise Up", 2018],
  ["Call Out", "ASTRO", "Rise Up", 2018],
  ["Stay with me", "ASTRO", "Rise Up", 2018],
  ["Real Love", "ASTRO", "Rise Up", 2018],
  ["Starry Sky", "ASTRO", "All Light", 2019],
  ["All Night", "ASTRO", "All Light", 2019],
  ["Moonwalk", "ASTRO", "All Light", 2019],
  ["Treasure", "ASTRO", "All Light", 2019],
  ["Role Play", "ASTRO", "All Light", 2019],
  ["1 In A Million", "ASTRO", "All Light", 2019],
  ["Love Wheel", "ASTRO", "All Light", 2019],
  ["Heart Brew Love", "ASTRO", "All Light", 2019],
  ["Merry-Go-Round", "ASTRO", "All Light", 2019],
  ["Bloom", "ASTRO", "All Light", 2019],
  ["Blue Flame", "ASTRO", "Blue Flame", 2019],
  ["Go&Stop", "ASTRO", "Blue Flame", 2019],
  ["All About You", "ASTRO", "Blue Flame", 2019],
  ["When The Wind Blows", "ASTRO", "Blue Flame", 2019],
  ["You're my world", "ASTRO", "Blue Flame", 2019],
  ["One & Only", "ASTRO", "One&Only", 2020],
  ["Knock", "ASTRO", "Gateway", 2020],
  ["When You Call My Name", "ASTRO", "Gateway", 2020],
  ["Somebody Like", "ASTRO", "Gateway", 2020],
  ["We Still", "ASTRO", "Gateway", 2020],
  ["12 Hours", "ASTRO", "Gateway", 2020],
  ["Lights On", "ASTRO", "Gateway", 2020],
  ["Dear my universe", "ASTRO", "All Yours", 2021],
  ["Butterfly Effect", "ASTRO", "All Yours", 2021],
  ["ONE", "ASTRO", "All Yours", 2021],
  ["Someone Else", "ASTRO", "All Yours", 2021],
  ["SNS", "ASTRO", "All Yours", 2021],
  ["All Good", "ASTRO", "All Yours", 2021],
  ["All Stars", "ASTRO", "All Yours", 2021],
  ["Our spring", "ASTRO", "All Yours", 2021],
  ["Stardust", "ASTRO", "All Yours", 2021],
  ["gemini", "ASTRO", "All Yours", 2021],
  ["After Midnight", "ASTRO", "Switch On", 2021],
  ["Footprint", "ASTRO", "Switch On", 2021],
  ["Waterfall", "ASTRO", "Switch On", 2021],
  ["Sunset Sky", "ASTRO", "Switch On", 2021],
  ["MY ZONE", "ASTRO", "Switch On", 2021],
  ["Don't Worry", "ASTRO", "Switch On", 2021],
  ["Candy Sugar Pop", "ASTRO", "Drive to the Starry Road", 2022],
  ["Something Something", "ASTRO", "Drive to the Starry Road", 2022],
  ["More", "ASTRO", "Drive to the Starry Road", 2022],
  ["Light the sky", "ASTRO", "Drive to the Starry Road", 2022],
  ["Story", "ASTRO", "Drive to the Starry Road", 2022],
  ["All Day", "ASTRO", "Drive to the Starry Road", 2022],
  ["First Love", "ASTRO", "Drive to the Starry Road", 2022],
  ["Let's go ride", "ASTRO", "Drive to the Starry Road", 2022],
  ["11 Minutes", "ASTRO", "Drive to the Starry Road", 2022],
  ["Like stars", "ASTRO", "Drive to the Starry Road", 2022],
  ["Eyez On U", "Moonbin & Sanha", "In-Out", 2020],
  ["Bad Idea", "Moonbin & Sanha", "In-Out", 2020],
  ["Alone", "Moonbin & Sanha", "In-Out", 2020],
  ["All I Wanna Do", "Moonbin & Sanha", "In-Out", 2020],
  ["Dream Catcher", "Moonbin & Sanha", "In-Out", 2020],
  ["Ghost Town", "Moonbin & Sanha", "Refuge", 2022],
  ["WHO", "Moonbin & Sanha", "Refuge", 2022],
  ["BOO", "Moonbin & Sanha", "Refuge", 2022],
  ["DIA", "Moonbin & Sanha", "Refuge", 2022],
  ["Distance", "Moonbin & Sanha", "Refuge", 2022],
  ["Perfume", "Moonbin & Sanha", "Incense", 2023],
  ["Madness", "Moonbin & Sanha", "Incense", 2023],
  ["Desire", "Moonbin & Sanha", "Incense", 2023],
  ["Wish", "Moonbin & Sanha", "Incense", 2023],
  ["Chup Chup", "Moonbin & Sanha", "Incense", 2023],
  ["Your day", "Moonbin & Sanha", "Incense", 2023],
  ["Just Breath", "Jinjin & Rocky", "Restore", 2022],
  ["Lazy", "Jinjin & Rocky", "Restore", 2022],
  ["Lock down", "Jinjin & Rocky", "Restore", 2022],
  ["Complete Me", "Jinjin & Rocky", "Restore", 2022],
  ["CPR", "Jinjin & Rocky", "Restore", 2022],
  ["U&I", "Cha Eun-woo", "ENTITY", 2024],
  ["STAY", "Cha Eun-woo", "ENTITY", 2024],
  ["WHERE AM I", "Cha Eun-woo", "ENTITY", 2024],
  ["You're the best", "Cha Eun-woo", "ENTITY", 2024],
  ["Memories", "Cha Eun-woo", "ENTITY", 2024],
  ["Music Is My Life", "Rocky", "ROCKYST", 2023],
  ["Lucky Rocky", "Rocky", "ROCKYST", 2023],
  ["Your Halley", "Rocky", "ROCKYST", 2023],
  ["Chameleon", "Rocky", "ROCKYST", 2023],
  ["Find Me", "Rocky", "ROCKYST", 2023],
  ["Yes or No", "Rocky", "ROCKYST", 2023],
  ["We still love you", "Rocky", "BLANK", 2024],
  ["Jealousy", "Rocky", "BLANK", 2024],
  ["Masterpiece", "Rocky", "BLANK", 2024],
  ["Read you", "Rocky", "BLANK", 2024],
  ["Jaywalking", "Rocky", "UNSAID", 2026],
  ["Hide and Seek", "Rocky", "UNSAID", 2026],
  ["Fake It", "Rocky", "UNSAID", 2026],
  ["Proxy", "Rocky", "UNSAID", 2026],
  ["Get Set Yo", "MJ", "Happy Virus", 2021],
  ["Valet Parking", "MJ", "Happy Virus", 2021],
  ["DICE", "JuniGini", "DICE", 2025],
  ["1~10, 1 min ago", "MJ", "Right..?", 2026],
  ["I Don't Know", "Apink", "Seven Springs of Apink", 2011],
  ["Wishlist", "Apink", "Seven Springs of Apink", 2011],
  ["Boo", "Apink", "Seven Springs of Apink", 2011],
  ["Its You", "Apink", "Seven Springs of Apink", 2011],
  ["It Girl", "Apink", "Seven Springs of Apink", 2011],
  ["My My", "Apink", "Snow Pink", 2011],
  ["Step", "Apink", "Snow Pink", 2011],
  ["Boy", "Apink", "Snow Pink", 2011],
  ["April Story", "Apink", "Snow Pink", 2011],
  ["Feeling", "Apink", "Snow Pink", 2011],
  ["BUBIBU", "Apink", "UNE ANNEE", 2012],
  ["Mari May", "Apink", "UNE ANNEE", 2012],
  ["Hush", "Apink", "UNE ANNEE", 2012],
  ["Cat", "Apink", "UNE ANNEE", 2012],
  ["April 19th", "Apink", "UNE ANNEE", 2012],
  ["NoNoNo", "Apink", "Secret Garden", 2013],
  ["Secret Garden", "Apink", "Secret Garden", 2013],
  ["Lovely Day", "Apink", "Secret Garden", 2013],
  ["I Need You", "Apink", "Secret Garden", 2013],
  ["Mr. Chu", "Apink", "Pink Blossom", 2014],
  ["Crystal", "Apink", "Pink Blossom", 2014],
  ["Love Story", "Apink", "Pink Blossom", 2014],
  ["So Long", "Apink", "Pink Blossom", 2014],
  ["Sensation", "Apink", "Pink Blossom", 2014],
  ["LUV", "Apink", "Pink LUV", 2014],
  ["Good Morning Baby", "Apink", "Pink LUV", 2014],
  ["Secret", "Apink", "Pink LUV", 2014],
  ["Expriment", "Apink", "Pink LUV", 2014],
  ["Remember", "Apink", "Pink Memory", 2015],
  ["Perfume", "Apink", "Pink Memory", 2015],
  ["Attracted to You", "Apink", "Pink Memory", 2015],
  ["Dejavu", "Apink", "Pink Memory", 2015],
  ["Petal", "Apink", "Pink Memory", 2015],
  ["What a Boy", "Apink", "Pink Memory", 2015],
  ["I Do", "Apink", "Pink Memory", 2015],
  ["Sunday Monday", "Apink", "Pink Memory", 2015],
  ["Simply", "Apink", "Pink Memory", 2015],
  ["Brand New Days", "Apink", "Pink Story", 2015],
  ["The Wave", "Apink", "Pink Revolution", 2016],
  ["Only One", "Apink", "Pink Revolution", 2016],
  ["Oh Yes", "Apink", "Pink Revolution", 2016],
  ["Boom Pow Love", "Apink", "Pink Revolution", 2016],
  ["Fairy", "Apink", "Pink Revolution", 2016],
  ["Drummer Boy", "Apink", "Pink Revolution", 2016],
  ["To. Us", "Apink", "Pink Revolution", 2016],
  ["Dear", "Apink", "Pink Revolution", 2016],
  ["Cause You're My Star", "Apink", "Dear", 2016],
  ["Miss U", "Apink", "Dear", 2016],
  ["Bye Bye", "Apink", "Bye Bye", 2017],
  ["Five", "Apink", "Pink Up", 2017],
  ["Eyes", "Apink", "Pink Up", 2017],
  ["Kingdom Come", "Apink", "Pink Up", 2017],
  ["Always", "Apink", "Pink Up", 2017],
  ["Kokoro", "Apink", "Kokoro", 2017],
  ["Orion", "Apink", "Orion", 2017],
  ["I'm So Sick", "Apink", "One & Six", 2018],
  ["A L R I G H T", "Apink", "One & Six", 2018],
  ["Don't Be Silly", "Apink", "One & Six", 2018],
  ["Forever Star", "Apink", "One & Six", 2018],
  ["It's You", "Apink", "One & Six", 2018],
  ["Percent", "Apink", "Percent", 2019],
  ["Eung Eung", "Apink", "Percent", 2019],
  ["Hug Me", "Apink", "Percent", 2019],
  ["What Am I Looking For", "Apink", "Percent", 2019],
  ["Enough", "Apink", "Percent", 2019],
  ["Memories", "Apink", "Percent", 2019],
  ["Dumhdurum", "Apink", "Look", 2020],
  ["Yummy Yummy", "Apink", "Look", 2020],
  ["Be Myself", "Apink", "Look", 2020],
  ["Love Is Blind", "Apink", "Look", 2020],
  ["Tension", "Apink", "Look", 2020],
  ["Nothing", "Apink", "Look", 2020],
  ["Dilemma", "Apink", "HORN", 2022],
  ["Holy Moly", "Apink", "HORN", 2022],
  ["Free & Love", "Apink", "HORN", 2022],
  ["Single Rider", "Apink", "HORN", 2022],
  ["Jelly", "Apink", "HORN", 2022],
  ["Buenos Aires", "Apink", "HORN", 2022],
  ["My Zone", "Apink", "HORN", 2022],
  ["Red Carpet", "Apink", "HORN", 2022],
  ["DND", "Apink", "Selfless", 2023],
  ["With You", "Apink", "Selfless", 2023],
  ["Me, Myself & I", "Apink", "Selfless", 2023],
  ["Candy", "Apink", "Selfless", 2023],
  ["Wait Me", "Apink", "Selfless", 2023],
  ["Wait For Us", "Apink", "Wait For Us", 2025],
  ["Breeze", "Apink", "Wait For Us", 2025],
  ["Time Lapse", "Apink", "Wait For Us", 2025],
  ["Cactus", "A.C.E", "cactus", 2017],
  ["Callin'", "A.C.E", "Callin'", 2017],
  ["5TAR (Incompletion)", "A.C.E", "5TAR (Incompletion)", 2018],
  ["Black and Blue", "A.C.E", "A.C.E Adventures in Wonderland", 2018],
  ["Take Me Higher", "A.C.E", "A.C.E Adventures in Wonderland", 2018],
  ["Dessert", "A.C.E", "A.C.E Adventures in Wonderland", 2018],
  ["If You Leave Me", "A.C.E", "UNDER COVER", 2019],
  ["Under Cover", "A.C.E", "UNDER COVER", 2019],
  ["Mr. Bass", "A.C.E", "UNDER COVER", 2019],
  ["Climax", "A.C.E", "UNDER COVER", 2019],
  ["Step by Step", "A.C.E", "UNDER COVER : AREA", 2019],
  ["Savage", "A.C.E", "UNDER COVER : AREA", 2019],
  ["Sugar", "A.C.E", "UNDER COVER : THE MADNESS", 2019],
  ["Falling", "A.C.E", "UNDER COVER : THE MADNESS", 2019],
  ["Oasis", "A.C.E", "UNDER COVER : THE MADNESS", 2019],
  ["Stand by You", "A.C.E", "Stand by You", 2019],
  ["Golden Goose", "A.C.E", "HJZM : The Butterfly Phantasy", 2020],
  ["Goblin", "A.C.E", "HJZM : The Butterfly Phantasy", 2020],
  ["Lighthouse", "A.C.E", "HJZM : The Butterfly Phantasy", 2020],
  ["Remember Us", "A.C.E", "HJZM : The Butterfly Phantasy", 2020],
  ["Atlantis", "A.C.E", "SIREN : DAWN", 2021],
  ["Changer", "A.C.E", "SIREN : DAWN", 2021],
  ["Higher", "A.C.E", "SIREN : DAWN", 2021],
  ["Story", "A.C.E", "SIREN : DAWN", 2021],
  ["Dangerous", "A.C.E", "SIREN : DAWN", 2021],
  ["Black Ink", "A.C.E", "Changer : Dear Metaverse", 2021],
  ["Angel", "A.C.E", "My Girl : \"My Choice\"", 2024],
  ["My Girl", "A.C.E", "My Girl : \"My Choice\"", 2024],
  ["Facetime", "A.C.E", "My Girl : \"My Choice\"", 2024],
  ["Effortless", "A.C.E", "My Girl : \"My Choice\"", 2024],
  ["Supernatural", "A.C.E", "Supernatural", 2024],
  ["Starlight", "A.C.E", "Supernatural", 2024],
  ["Pinata", "A.C.E", "PINATA", 2024],
  ["Danger", "A.C.E", "PINATA", 2024],
  ["Slow Motion", "A.C.E", "PINATA", 2024],
  ["We Are Bulletproof Pt. 2", "BTS", "2 Cool 4 Skool", 2013],
  ["No More Dream", "BTS", "2 Cool 4 Skool", 2013],
  ["I Like It", "BTS", "2 Cool 4 Skool", 2013],
  ["Path", "BTS", "2 Cool 4 Skool", 2013],
  ["N.O", "BTS", "O!RUL8,2?", 2013],
  ["We On", "BTS", "O!RUL8,2?", 2013],
  ["If I Ruled the World", "BTS", "O!RUL8,2?", 2013],
  ["Coffee", "BTS", "O!RUL8,2?", 2013],
  ["Attack on Bangtan", "BTS", "O!RUL8,2?", 2013],
  ["Boy in Luv", "BTS", "Skool Luv Affair", 2014],
  ["Where You From", "BTS", "Skool Luv Affair", 2014],
  ["Just One Day", "BTS", "Skool Luv Affair", 2014],
  ["Tomorrow", "BTS", "Skool Luv Affair", 2014],
  ["Spine Breaker", "BTS", "Skool Luv Affair", 2014],
  ["Danger", "BTS", "Dark & Wild", 2014],
  ["War of Hormone", "BTS", "Dark & Wild", 2014],
  ["Hip Hop Phile", "BTS", "Dark & Wild", 2014],
  ["Let Me Know", "BTS", "Dark & Wild", 2014],
  ["Rain", "BTS", "Dark & Wild", 2014],
  ["Embarrassed", "BTS", "Dark & Wild", 2014],
  ["Wake Up", "BTS", "Wake Up", 2014],
  ["I Need U", "BTS", "The Most Beautiful Moment in Life, Pt. 1", 2015],
  ["Hold Me Tight", "BTS", "The Most Beautiful Moment in Life, Pt. 1", 2015],
  ["Dope", "BTS", "The Most Beautiful Moment in Life, Pt. 1", 2015],
  ["Boyz with Fun", "BTS", "The Most Beautiful Moment in Life, Pt. 1", 2015],
  ["Run", "BTS", "The Most Beautiful Moment in Life, Pt. 2", 2015],
  ["Butterfly", "BTS", "The Most Beautiful Moment in Life, Pt. 2", 2015],
  ["Whalien 52", "BTS", "The Most Beautiful Moment in Life, Pt. 2", 2015],
  ["Autumn Leaves", "BTS", "The Most Beautiful Moment in Life, Pt. 2", 2015],
  ["Fire", "BTS", "The Most Beautiful Moment in Life: Young Forever", 2016],
  ["Save Me", "BTS", "The Most Beautiful Moment in Life: Young Forever", 2016],
  ["Blood Sweat & Tears", "BTS", "Wings", 2016],
  ["Begin", "BTS", "Wings", 2016],
  ["Lie", "BTS", "Wings", 2016],
  ["Stigma", "BTS", "Wings", 2016],
  ["First Love", "BTS", "Wings", 2016],
  ["Reflection", "BTS", "Wings", 2016],
  ["MAMA", "BTS", "Wings", 2016],
  ["Awake", "BTS", "Wings", 2016],
  ["Lost", "BTS", "Wings", 2016],
  ["Am I Wrong", "BTS", "Wings", 2016],
  ["21st Century Girl", "BTS", "Wings", 2016],
  ["Spring Day", "BTS", "You Never Walk Alone", 2017],
  ["Not Today", "BTS", "You Never Walk Alone", 2017],
  ["DNA", "BTS", "Love Yourself: Her", 2017],
  ["Best of Me", "BTS", "Love Yourself: Her", 2017],
  ["Serendipity", "BTS", "Love Yourself: Her", 2017],
  ["Dimple", "BTS", "Love Yourself: Her", 2017],
  ["Pied Piper", "BTS", "Love Yourself: Her", 2017],
  ["Go Go", "BTS", "Love Yourself: Her", 2017],
  ["MIC Drop", "BTS", "Love Yourself: Her", 2017],
  ["Fake Love", "BTS", "Love Yourself: Tear", 2018],
  ["Anpanman", "BTS", "Love Yourself: Tear", 2018],
  ["Magic Shop", "BTS", "Love Yourself: Tear", 2018],
  ["Idol", "BTS", "Love Yourself: Answer", 2018],
  ["Epiphany", "BTS", "Love Yourself: Answer", 2018],
  ["I'm Fine", "BTS", "Love Yourself: Answer", 2018],
  ["Boy With Luv", "BTS", "Map of the Soul: Persona", 2019],
  ["Mikrokosmos", "BTS", "Map of the Soul: Persona", 2019],
  ["Make It Right", "BTS", "Map of the Soul: Persona", 2019],
  ["Home", "BTS", "Map of the Soul: Persona", 2019],
  ["Jamais Vu", "BTS", "Map of the Soul: Persona", 2019],
  ["Dionysus", "BTS", "Map of the Soul: Persona", 2019],
  ["ON", "BTS", "Map of the Soul: 7", 2020],
  ["Black Swan", "BTS", "Map of the Soul: 7", 2020],
  ["Filter", "BTS", "Map of the Soul: 7", 2020],
  ["My Time", "BTS", "Map of the Soul: 7", 2020],
  ["Louder than bombs", "BTS", "Map of the Soul: 7", 2020],
  ["Friends", "BTS", "Map of the Soul: 7", 2020],
  ["Moon", "BTS", "Map of the Soul: 7", 2020],
  ["Respect", "BTS", "Map of the Soul: 7", 2020],
  ["Dynamite", "BTS", "BE", 2020],
  ["Life Goes On", "BTS", "BE", 2020],
  ["Fly To My Room", "BTS", "BE", 2020],
  ["Blue & Grey", "BTS", "BE", 2020],
  ["Telepathy", "BTS", "BE", 2020],
  ["Dis-ease", "BTS", "BE", 2020],
  ["Stay", "BTS", "BE", 2020],
  ["Butter", "BTS", "Butter / Permission to Dance", 2021],
  ["Permission to Dance", "BTS", "Butter / Permission to Dance", 2021],
  ["My Universe", "BTS", "Music of the Spheres", 2021],
  ["Yet To Come", "BTS", "Proof", 2022],
  ["Run BTS", "BTS", "Proof", 2022],
  ["For Youth", "BTS", "Proof", 2022],
  ["Take Two", "BTS", "Take Two", 2023],
  ["2.0", "BTS", "Arirang", 2026],
  ["Swim", "BTS", "Arirang", 2026],
  ["Hooligan", "BTS", "Arirang", 2026],
  ["Normal", "BTS", "Arirang", 2026],
  ["Echoes of Korea", "BTS", "Arirang", 2026],
  ["Dawn to Dusk", "BTS", "Arirang", 2026],
  ["Daydream", "J-Hope", "Hope World", 2018],
  ["Airplane", "J-Hope", "Hope World", 2018],
  ["Base Line", "J-Hope", "Hope World", 2018],
  ["Chicken Noodle Soup", "J-Hope", "Chicken Noodle Soup", 2019],
  ["More", "J-Hope", "Jack In The Box", 2022],
  ["Arson", "J-Hope", "Jack In The Box", 2022],
  ["Pandora's Box", "J-Hope", "Jack In The Box", 2022],
  ["Equal Sign", "J-Hope", "Jack In The Box", 2022],
  ["Safety Zone", "J-Hope", "Jack In The Box", 2022],
  ["Future", "J-Hope", "Jack In The Box", 2022],
  ["On the Street", "J-Hope", "on the street", 2023],
  ["Monet", "J-Hope", "MONET", 2026],
  ["Abyss", "Jin", "Abyss", 2020],
  ["Super Tuna", "Jin", "Super Tuna", 2022],
  ["The Astronaut", "Jin", "The Astronaut", 2022],
  ["Running Wild", "Jin", "Happy", 2024],
  ["I'll Be There", "Jin", "Happy", 2024],
  ["Another Level", "Jin", "Happy", 2024],
  ["In the Forest", "Jin", "Happy", 2024],
  ["Don't Leave Me Behind", "Jin", "Echoes", 2026],
  ["Promise", "Jimin", "Promise", 2018],
  ["Like Crazy", "Jimin", "FACE", 2023],
  ["Face-off", "Jimin", "FACE", 2023],
  ["Alone", "Jimin", "FACE", 2023],
  ["Closer Than This", "Jimin", "Closer Than This", 2023],
  ["Who", "Jimin", "MUSE", 2024],
  ["Smeraldo Garden Marching Band", "Jimin", "MUSE", 2024],
  ["Slow Dance", "Jimin", "MUSE", 2024],
  ["Be Mine", "Jimin", "MUSE", 2024],
  ["Left and Right", "Jung Kook", "CHARLIE", 2022],
  ["Seven", "Jung Kook", "GOLDEN", 2023],
  ["3D", "Jung Kook", "GOLDEN", 2023],
  ["Standing Next to You", "Jung Kook", "GOLDEN", 2023],
  ["Closer to You", "Jung Kook", "GOLDEN", 2023],
  ["Yes or No", "Jung Kook", "GOLDEN", 2023],
  ["Hate You", "Jung Kook", "GOLDEN", 2023],
  ["Somebody", "Jung Kook", "GOLDEN", 2023],
  ["Never Let Go", "Jung Kook", "Never Let Go", 2024],
  ["Do You", "RM", "RM", 2015],
  ["Mono", "RM", "mono.", 2018],
  ["Tokyo", "RM", "mono.", 2018],
  ["Seoul", "RM", "mono.", 2018],
  ["Wild Flower", "RM", "Indigo", 2022],
  ["Still Life", "RM", "Indigo", 2022],
  ["Lonely", "RM", "Indigo", 2022],
  ["Come Back to Me", "RM", "Right Place, Wrong Person", 2024],
  ["Lost!", "RM", "Right Place, Wrong Person", 2024],
  ["Nuts", "RM", "Right Place, Wrong Person", 2024],
  ["Heaven", "RM", "Right Place, Wrong Person", 2024],
  ["Agust D", "Suga / Agust D", "Agust D", 2016],
  ["Daechwita", "Suga / Agust D", "D-2", 2020],
  ["People", "Suga / Agust D", "D-2", 2020],
  ["Haegeum", "Suga / Agust D", "D-DAY", 2023],
  ["AMYGDALA", "Suga / Agust D", "D-DAY", 2023],
  ["SDL", "Suga / Agust D", "D-DAY", 2023],
  ["Life Goes On", "Suga / Agust D", "D-DAY", 2023],
  ["Singularity", "V", "Love Yourself: Tear", 2018],
  ["Sweet Night", "V", "Itaewon Class OST", 2020],
  ["Christmas Tree", "V", "Our Beloved Summer OST", 2021],
  ["Slow Dancing", "V", "Layover", 2023],
  ["Rainy Days", "V", "Layover", 2023],
  ["Blue", "V", "Layover", 2023],
  ["Love Me Again", "V", "Layover", 2023],
  ["FRI(END)S", "V", "FRI(END)S", 2024],
  ["Boombayah", "BLACKPINK", "Square One", 2016],
  ["Whistle", "BLACKPINK", "Square One", 2016],
  ["Playing with Fire", "BLACKPINK", "Square Two", 2016],
  ["Ddu-Du Ddu-Du", "BLACKPINK", "Square Up", 2018],
  ["Forever Young", "BLACKPINK", "Square Up", 2018],
  ["Really", "BLACKPINK", "Square Up", 2018],
  ["Kill This Love", "BLACKPINK", "Kill This Love", 2019],
  ["Don't Know What To Do", "BLACKPINK", "Kill This Love", 2019],
  ["Kick It", "BLACKPINK", "Kill This Love", 2019],
  ["How You Like That", "BLACKPINK", "The Album", 2020],
  ["Ice Cream", "BLACKPINK", "The Album", 2020],
  ["Pretty Savage", "BLACKPINK", "The Album", 2020],
  ["Lovesick Girls", "BLACKPINK", "The Album", 2020],
  ["Crazy Over You", "BLACKPINK", "The Album", 2020],
  ["Love To Hate Me", "BLACKPINK", "The Album", 2020],
  ["Pink Venom", "BLACKPINK", "Born Pink", 2022],
  ["Shut Down", "BLACKPINK", "Born Pink", 2022],
  ["Typa Girl", "BLACKPINK", "Born Pink", 2022],
  ["Yeah Yeah Yeah", "BLACKPINK", "Born Pink", 2022],
  ["Hard to Love", "BLACKPINK", "Born Pink", 2022],
  ["The Happiest Girl", "BLACKPINK", "Born Pink", 2022],
  ["Tally", "BLACKPINK", "Born Pink", 2022],
  ["The Girls", "BLACKPINK", "The Girls", 2023],
  ["JUMP", "BLACKPINK", "JUMP", 2025],
  ["REVIVE", "BLACKPINK", "REVIVE", 2026],
  ["SOLO", "Jennie", "SOLO", 2018],
  ["You & Me", "Jennie", "You & Me", 2023],
  ["Mantra", "Jennie", "Mantra", 2024],
  ["ZENITH", "Jennie", "ZENITH", 2025],
  ["Flower", "Jisoo", "ME", 2023],
  ["All Eyes On Me", "Jisoo", "ME", 2023],
  ["Earthquake", "Jisoo", "AMORTALS", 2025],
  ["Lightning", "Jisoo", "AMORTALS", 2025],
  ["On The Ground", "Rosé", "-R-", 2021],
  ["Gone", "Rosé", "-R-", 2021],
  ["APT.", "Rosé", "rosie", 2024],
  ["number one girl", "Rosé", "rosie", 2024],
  ["Toxic Till The End", "Rosé", "rosie", 2024],
  ["LALISA", "Lisa", "LALISA", 2021],
  ["Money", "Lisa", "LALISA", 2021],
  ["Rockstar", "Lisa", "Rockstar", 2024],
  ["New Woman", "Lisa", "New Woman", 2024],
  ["Moonlit Floor", "Lisa", "Moonlit Floor", 2024],
  ["ALTER EGO", "Lisa", "ALTER EGO", 2025],
  ["BATTER UP", "BabyMonster", "BATTER UP", 2023],
  ["SHEESH", "BabyMonster", "BABYMONS7ER", 2024],
  ["LIKE THAT", "BabyMonster", "BABYMONS7ER", 2024],
  ["FOREVER", "BabyMonster", "FOREVER", 2024],
  ["DRIP", "BabyMonster", "DRIP", 2024],
  ["Billionaire", "BabyMonster", "DRIP", 2024],
  ["WE GO", "BabyMonster", "WE GO", 2025],
  ["WIZARD", "BabyMonster", "WIZARD", 2025],
  ["PSYCHO", "BabyMonster", "WIZARD", 2025],
  ["CHASE", "BabyMonster", "CHASE", 2026],
  ["Behind the Door", "BOYNEXTDOOR", "WHO!", 2023],
  ["One and Only", "BOYNEXTDOOR", "WHO!", 2023],
  ["But I Like You", "BOYNEXTDOOR", "WHY..", 2023],
  ["Earth, Wind & Fire", "BOYNEXTDOOR", "HOW?", 2024],
  ["Amnesia", "BOYNEXTDOOR", "HOW?", 2024],
  ["Dangerous", "BOYNEXTDOOR", "19.99", 2024],
  ["Nice Guy", "BOYNEXTDOOR", "19.99", 2024],
  ["COLD LOVE", "BOYNEXTDOOR", "COLD LOVE", 2025],
  ["IF I DIE", "BOYNEXTDOOR", "IF I DIE", 2025],
  ["BREEZE", "BOYNEXTDOOR", "BREEZE", 2025],
  ["Crush on U", "BAE173", "INTERSECTION : SPARK", 2020],
  ["Runnin'", "BAE173", "INTERSECTION : BLAZE", 2022],
  ["Fifty-Fifty", "BAE173", "NEW CHAPTER : LUCEAT", 2024],
  ["One Day", "BAE173", "NEW CHAPTER : DESEAR", 2025],
  ["Bad Girl", "BEAST", "Beast Is the B2ST", 2009],
  ["Shock", "BEAST", "Shock of the New Era", 2010],
  ["Mastermind", "BEAST", "Mastermind", 2010],
  ["Fiction", "BEAST", "Fiction and Fact", 2011],
  ["Beautiful Night", "BEAST", "Midnight - Sun-", 2012],
  ["How to Love", "BEAST", "Hard to Love, How to Love", 2013],
  ["Good Luck", "BEAST", "Good Luck", 2014],
  ["Drive", "BEAST", "Time", 2014],
  ["Yey", "BEAST", "Ordinary", 2015],
  ["Butterfly", "BEAST", "Highlight", 2016],
  ["Ribbon", "BEAST", "Highlight", 2016],
  ["Pitapat", "BESTie", "Pitapat", 2013],
  ["Hot Baby", "BESTie", "Hot Baby", 2014],
  ["Tonight", "Blackswan", "Goodbye Rania", 2020],
  ["Close to Me", "Blackswan", "Close to Me", 2021],
  ["Karma", "Blackswan", "That Karma", 2023],
  ["Roll Up", "Blackswan", "Roll Up", 2024],
  ["Damaged", "Blackswan", "Damaged", 2025],
  ["Breathe", "Blackswan", "Breathe", 2026],
  ["Abracadabra", "Brown Eyed Girls", "Sound-G", 2009],
  ["Sixth Sense", "Brown Eyed Girls", "Sixth Sense", 2011],
  ["Kill Bill", "Brown Eyed Girls", "Black Box", 2013],
  ["No One Knows", "Eunkwang", "FoRest : Entrance", 2020],
  ["YA", "Minhyuk / HUTA", "HUTAZONE", 2019],
  ["BOOM", "Minhyuk / HUTA", "BOOM", 2022],
  ["Gone", "Changsub", "Mark", 2018],
  ["Surrender", "Changsub", "Surrender", 2022],
  ["RENDEZ-VOUS", "Hyunsik", "Rendez-vous", 2019],
  ["HIP HOP", "Peniel", "HOMESICK", 2019],
  ["Tell Me", "Sungjae", "Piece of BTOB Vol. 4", 2017],
  ["Bad Girl", "JeA", "Bad Girl", 2016],
  ["Queen", "Miryo", "Queen", 2015],
  ["Fantastic", "Narsha", "Narsha", 2010],
  ["Truth or Dare", "Gain", "Truth or Dare", 2014],
  ["WOW", "BTOB", "Press Play", 2012],
  ["Thriller", "BTOB", "Thriller", 2013],
  ["Beep Beep", "BTOB", "Beep Beep", 2014],
  ["It's Okay", "BTOB", "Complete", 2015],
  ["Way Back Home", "BTOB", "I Mean", 2015],
  ["Remember That", "BTOB", "Remember That", 2016],
  ["New Men", "BTOB", "New Men", 2016],
  ["Movie", "BTOB", "Feel'eM", 2017],
  ["Missing You", "BTOB", "Brother Act.", 2017],
  ["The Feeling", "BTOB", "This Is Us", 2018],
  ["Show Your Love", "BTOB", "Inside", 2020],
  ["Outsider", "BTOB", "4U : Outside", 2021],
  ["The Song", "BTOB", "Be Together", 2022],
  ["Wind and Wish", "BTOB", "Wind and Wish", 2023],
  ["Hocus Pocus", "BVNDIT", "BVNDIT, BE AMBITIOUS!", 2019],
  ["Carnival", "BVNDIT", "Carnival", 2019],
  ["Venom", "BVNDIT", "Re-Original", 2022],
  ["Movie Star", "CIX", "Hello Chapter 1. Hello, Stranger", 2019],
  ["Numb", "CIX", "Hello Chapter 2. Hello, Strange Place", 2019],
  ["Jungle", "CIX", "Hello Chapter 3. Hello, Strange Time", 2020],
  ["Cinema", "CIX", "Hello Chapter Ø. Hello, Strange Dream", 2021],
  ["Wandering Youth", "CIX", "OK Prologue : Be OK", 2021],
  ["Pinky Oath", "CIX", "Pinky Oath", 2022],
  ["Marine Boy", "CIX", "Marine Boy", 2022],
  ["458", "CIX", "OK Episode 1 : Wind and Growth", 2022],
  ["Save me, Kill me", "CIX", "OK Episode 2 : I'm OK", 2023],
  ["Lovers or Enemies", "CIX", "0 or 1", 2024],
  ["Pepe", "CLC", "First Love", 2015],
  ["Eighteen", "CLC", "Eighteen", 2015],
  ["High Heels", "CLC", "Refresh", 2016],
  ["No Oh Oh", "CLC", "Nu.Clear", 2016],
  ["Meow Meow", "CLC", "Crystyle", 2017],
  ["Black Dress", "CLC", "Black Dress", 2018],
  ["No", "CLC", "No.1", 2019],
  ["Devil", "CLC", "Devil", 2019],
  ["Helicopter", "CLC", "Helicopter", 2020],
  ["Now or Never", "CNBLUE", "Now or Never", 2009],
  ["Love Revolution", "CNBLUE", "Now or Never", 2009],
  ["Hey You", "CNBLUE", "Ear Fun", 2012],
  ["Robot", "CNBLUE", "Robot", 2012],
  ["I'm Sorry", "CNBLUE", "Re:Blue", 2013],
  ["Can't Stop", "CNBLUE", "Can't Stop", 2014],
  ["Cinderella", "CNBLUE", "2gether", 2015],
  ["Puzzle", "CNBLUE", "Puzzle", 2016],
  ["Between Us", "CNBLUE", "7°CN", 2017],
  ["WANTED", "CNBLUE", "Wanted", 2021],
  ["Bing Bing", "Crayon Pop", "Crayon Pop 1st Mini Album", 2012],
  ["Bar Bar Bar", "Crayon Pop", "The Streets Go Pop", 2013],
  ["Uh-ee", "Crayon Pop", "Uh-ee", 2014],
  ["FM", "Crayon Pop", "FM", 2015],
  ["Vroom Vroom", "Crayon Pop", "Vroom Vroom", 2016],
  ["La-Di Da-Di", "Cross Gene", "Timeless : Begin", 2012],
  ["Shooting Star", "Cross Gene", "Shooting Star", 2013],
  ["Amazing -Bad Lady-", "Cross Gene", "Amazing -Bad Lady-", 2014],
  ["Zero", "Cross Gene", "Zero", 2018],
  ["Love Club", "SPEED", "Superior Speed", 2013],
  ["Pain", "SPEED", "Blow Speed", 2014],
  ["Strange Way To Love", "Yeeun", "The Beginning", 2023],
  ["Picky", "Yeeun", "Picky", 2024],
  ["Break all the Rules", "Cravity", "Season 1. Hideout : Remember Who We Are", 2020],
  ["Flame", "Cravity", "Season 2. Hideout : The New Day We Step Into", 2020],
  ["My Turn", "Cravity", "Season 3. Hideout : Be Our Voice", 2021],
  ["Gas Pedal", "Cravity", "The Awakening : Written in the Stars", 2021],
  ["Adrenaline", "Cravity", "Liberty: In Our Cosmos", 2022],
  ["Party Rock", "Cravity", "New Wave", 2022],
  ["Groovy", "Cravity", "Master: Piece", 2023],
  ["Megaphone", "Cravity", "Sun Seeker", 2023],
  ["Love or Die", "Cravity", "EVERSHINE", 2024],
  ["Now or Never", "Cravity", "Now or Never", 2024],
  ["Flash", "Cravity", "Flash", 2026],
  ["My Universe", "CRAXY", "My Universe", 2019],
  ["NUGU", "CRAXY", "Who Am I", 2023],
  ["Compact", "CRAXY", "XX", 2024],
  ["Wicked", "CRAXY", "Wicked", 2024],
  ["Eclipse", "CRAXY", "Eclipse", 2025],
  ["Pop? Pop!", "CSR", "Sequence : 7272", 2022],
  ["Shining Bright", "CSR", "Delight", 2023],
  ["Signal", "CSR", "Signal", 2024],
  ["Supa Dupa Diva", "Dal Shabet", "Supa Dupa Diva", 2011],
  ["Bling Bling", "Dal Shabet", "Bling Bling", 2011],
  ["Hit U", "Dal Shabet", "Hit U", 2012],
  ["Be Ambitious", "Dal Shabet", "Be Ambitious", 2013],
  ["Joker", "Dal Shabet", "Joker Is Alive", 2015],
  ["Even Though I Hate You, I Love You", "Davichi", "Amaranth", 2008],
  ["Cry Again", "Davichi", "Davichi Hug", 2015],
  ["Wish", "Davichi", "Wish", 2021],
  ["Congratulations", "Day6", "The Day", 2015],
  ["Letting Go", "Day6", "Daydream", 2016],
  ["You Were Beautiful", "Day6", "Every Day6 February", 2017],
  ["I Smile", "Day6", "Sunrise", 2017],
  ["Shoot Me", "Day6", "Shoot Me : Youth Part 1", 2018],
  ["Time of Our Life", "Day6", "The Book of Us : Gravity", 2019],
  ["Sweet Chaos", "Day6", "The Book of Us : Entropy", 2019],
  ["Zombie", "Day6", "The Book of Us : The Demon", 2020],
  ["You Make Me", "Day6", "The Book of Us : Negentropy", 2021],
  ["Welcome to the Show", "Day6", "Fourever", 2024],
  ["Base Line", "Young K", "Eternal", 2021],
  ["Bungee Jumping", "Young K", "Letters with notes", 2023],
  ["Voiceless", "Wonpil", "Pilmography", 2022],
  ["Covered in Love", "Sungjin", "30", 2024],
  ["Out of the Blue", "Dowoon", "Out of the Blue", 2021],
  ["Wanna Listen To Music?", "DIA", "Do It Amazing", 2015],
  ["Lean On Me", "DIA", "Do It Amazing", 2015],
  ["Somehow", "DIA", "Do It Amazing", 2015],
  ["My Friend's Boyfriend", "DIA", "Do It Amazing", 2015],
  ["Like Yesterday", "DIA", "Do It Amazing", 2015],
  ["My Polaris", "DIA", "Do It Amazing", 2015],
  ["Same Place", "DIA", "Do It Amazing", 2015],
  ["Say Hello", "DIA", "Do It Amazing", 2015],
  ["Happy Ending", "DIA", "Happy Ending", 2016],
  ["On The Road", "DIA", "Happy Ending", 2016],
  ["The Trainee", "DIA", "Happy Ending", 2016],
  ["7 3/4", "DIA", "Spell", 2016],
  ["Mr. Potter", "DIA", "Spell", 2016],
  ["The Love", "DIA", "Spell", 2016],
  ["Will You Go Out With Me", "DIA", "YOLO", 2017],
  ["Nam.Sa.Chin", "DIA", "YOLO", 2017],
  ["Mannequin", "DIA", "YOLO", 2017],
  ["Light", "DIA", "YOLO", 2017],
  ["Listen To This Song", "DIA", "YOLO", 2017],
  ["Not Only You But Spring", "DIA", "YOLO", 2017],
  ["You're Different", "DIA", "Love Generation", 2017],
  ["You & I", "DIA", "Love Generation", 2017],
  ["Paradise", "DIA", "Love Generation", 2017],
  ["Good Night", "DIA", "Present", 2017],
  ["Eye Contact", "DIA", "Present", 2017],
  ["Like U Like U", "DIA", "Summer Ade", 2018],
  ["WooWoo", "DIA", "Summer Ade", 2018],
  ["Grown Up", "DIA", "Summer Ade", 2018],
  ["Pick Up The Phone", "DIA", "Summer Ade", 2018],
  ["Take Me", "DIA", "Summer Ade", 2018],
  ["Sweet Dream", "DIA", "Summer Ade", 2018],
  ["Blue Day", "DIA", "Summer Ade", 2018],
  ["WOOWA", "DIA", "Newtro", 2019],
  ["No", "DIA", "Newtro", 2019],
  ["5 More Minutes", "DIA", "Newtro", 2019],
  ["Crescendo", "DIA", "Newtro", 2019],
  ["Daily", "DIA", "Flower 4 Seasons", 2020],
  ["Hug U", "DIA", "Flower 4 Seasons", 2020],
  ["To You", "DIA", "Flower 4 Seasons", 2020],
  ["Nobody Knows", "DIA", "Flower 4 Seasons", 2020],
  ["Rooting For You", "DIA", "Rooting For You", 2022],
  ["Just Do It", "BSS", "Just Do It", 2018],
  ["Fighting", "BSS", "SECOND WIND", 2023],
  ["Lunch", "BSS", "SECOND WIND", 2023],
  ["7PM", "BSS", "SECOND WIND", 2023],
  ["bugAboo", "bugAboo", "bugAboo", 2021],
  ["All In Up", "bugAboo", "bugAboo", 2021],
  ["Pop", "bugAboo", "POP", 2022],
  ["Easy Move", "bugAboo", "POP", 2022],
  ["What You Want", "Cortis", "Color You", 2023],
  ["Sunset", "Cortis", "Color You", 2023],
  ["Q&A", "Cherry Bullet", "Let's Play Cherry Bullet", 2019],
  ["Violet", "Cherry Bullet", "Let's Play Cherry Bullet", 2019],
  ["Love Wah", "Cherry Bullet", "Love Adventure", 2019],
  ["Hands Up", "Cherry Bullet", "Hands Up", 2020],
  ["Aloha Oe", "Cherry Bullet", "Aloha Oe", 2020],
  ["Love So Sweet", "Cherry Bullet", "Cherry Rush", 2021],
  ["Fly Away", "Cherry Bullet", "Cherry Rush", 2021],
  ["Love In Space", "Cherry Bullet", "Cherry Wish", 2022],
  ["P.O.W!", "Cherry Bullet", "Cherry Blast", 2023],
  ["I Like You", "Ciipher", "Fallin'", 2021],
  ["Blind", "Ciipher", "BLIND", 2021],
  ["The Way U Are", "Ciipher", "The Code", 2022],
  ["Good Girl", "Candy Shop", "Hashtag#.", 2024],
  ["Don't Crying", "Candy Shop", "Girls Don't Cry", 2024],
  ["Tip Toe", "Candy Shop", "Tip Toe", 2025],
  ["Close Your Eyes", "CLOSE YOUR EYES", "Eternalt", 2025],
  ["Paint Candy", "CLOSE YOUR EYES", "Snowy Summer", 2025],
  ["X", "CLOSE YOUR EYES", "Blackout", 2025],
  ["UP", "CLASS:y", "Class Is Over", 2022],
  ["Classy", "CLASS:y", "Lives Across", 2022],
  ["Tick Tick Boom", "CLASS:y", "Day & Night", 2022],
  ["My Love", "CLASS:y", "My Love", 2023],
  ["Burn Up", "DXMON", "Hyperspace", 2024],
  ["Spark", "DXMON", "Youth Never Die", 2024],
  ["MAMA", "EXO", "MAMA", 2012],
  ["Wolf", "EXO", "XOXO", 2013],
  ["Growl", "EXO", "XOXO", 2013],
  ["Miracles in December", "EXO", "Miracles in December", 2013],
  ["Overdose", "EXO", "Overdose", 2014],
  ["Call Me Baby", "EXO", "Exodus", 2015],
  ["Sing For You", "EXO", "Sing For You", 2015],
  ["Monster", "EXO", "Ex'Act", 2016],
  ["Lotto", "EXO", "Lotto", 2016],
  ["For Life", "EXO", "For Life", 2016],
  ["Ko Ko Bop", "EXO", "The War", 2017],
  ["Power", "EXO", "The Power of Music", 2017],
  ["Universe", "EXO", "Universe", 2017],
  ["Tempo", "EXO", "Don't Mess Up My Tempo", 2018],
  ["Love Shot", "EXO", "Love Shot", 2018],
  ["Obsession", "EXO", "Obsession", 2019],
  ["Cream Soda", "EXO", "Exist", 2023],
  ["Bon Bon Chocolat", "EVERGLOW", "Arrival of Everglow", 2019],
  ["Adios", "EVERGLOW", "Hush", 2019],
  ["Dun Dun", "EVERGLOW", "Reminiscence", 2020],
  ["La Di Da", "EVERGLOW", "-77.82X-78.29", 2020],
  ["First", "EVERGLOW", "Last Melody", 2021],
  ["Pirate", "EVERGLOW", "Return of the Girl", 2021],
  ["Slay", "EVERGLOW", "All About Girls", 2023],
  ["Zombie", "EVERGLOW", "Zombie", 2024],
  ["Trouble", "EVNNE", "Target: ME", 2023],
  ["UGLY", "EVNNE", "Un: SEEN", 2024],
  ["Badder Love", "EVNNE", "RIDE or DIE", 2024],
  ["Lock Down", "EPEX", "Bipolar Pt. 1", 2021],
  ["Do 4 Me", "EPEX", "Bipolar Pt. 2", 2021],
  ["Anthem of Teen Spirit", "EPEX", "Prelude of Anxiety Ch.1", 2022],
  ["Thank You, My You", "EPEX", "Prelude of Love Ch.1", 2022],
  ["Sunshower", "EPEX", "Prelude of Anxiety Ch.2", 2023],
  ["Youth2Youth", "EPEX", "Youth2Youth", 2024],
  ["Unbreakable", "EPEX", "Youth2Youth Part.2", 2024],
  ["Brand New", "Xiumin", "Brand New", 2022],
  ["CEO", "Xiumin", "Interview", 2024],
  ["Let's Love", "Suho", "Self-Portrait", 2020],
  ["Grey Suit", "Suho", "Grey Suit", 2022],
  ["1 to 3", "Suho", "1 to 3", 2024],
  ["Lose Control", "Lay", "Lose Control", 2016],
  ["Sheep", "Lay", "Sheep", 2017],
  ["Lit", "Lay", "Lit", 2020],
  ["View", "Lay", "Producer", 2021],
  ["East", "Lay", "East", 2021],
  ["City Lights", "Baekhyun", "City Lights", 2019],
  ["Candy", "Baekhyun", "Delight", 2020],
  ["Amusement Park", "Baekhyun", "Amusement Park", 2020],
  ["Bambi", "Baekhyun", "Bambi", 2021],
  ["Hello, World", "Baekhyun", "Hello, World", 2024],
  ["Beautiful Goodbye", "Chen", "April, and a Flower", 2019],
  ["Shall We?", "Chen", "Dear my dear", 2019],
  ["Last Scene", "Chen", "Last Scene", 2022],
  ["Polaris", "Chen", "Polaris", 2023],
  ["Door", "Chen", "Door", 2024],
  ["Good Enough", "Chanyeol", "Good Enough", 2023],
  ["Black Out", "Chanyeol", "Black Out", 2024],
  ["Empathy", "D.O.", "Empathy", 2021],
  ["Somebody", "D.O.", "Expectation", 2023],
  ["Popcorn", "D.O.", "Blossom", 2024],
  ["Mmmh", "Kai", "Kai", 2020],
  ["Peaches", "Kai", "Peaches", 2021],
  ["Rover", "Kai", "Rover", 2023],
  ["Wait on Me", "Kai", "Wait on Me", 2025],
  ["On Me", "Sehun", "On Me", 2020],
  ["Hey Mama!", "EXO-CBX", "Hey Mama!", 2016],
  ["Ka-Ching!", "EXO-CBX", "GIRLS", 2017],
  ["Blooming Day", "EXO-CBX", "Blooming Days", 2018],
  ["Horololo", "EXO-CBX", "Magic", 2018],
  ["What a Life", "EXO-SC", "What a Life", 2019],
  ["1 Billion Views", "EXO-SC", "1 Billion Views", 2020],
  ["Intro (Day Dream)", "E'LAST", "Day Dream", 2020],
  ["Dark Dream", "E'LAST", "Dark Dream", 2021],
  ["Intro (Roar)", "E'LAST", "Roar", 2022],
  ["Thrill", "E'LAST", "Thrill", 2023],
  ["Intro (Dystopia)", "E'LAST", "iDENTIFICATION", 2023],
  ["Crazy Train", "E'LAST", "EVERLASTING", 2024],
  ["Die for You", "EL7ZUP", "7+UP", 2023],
  ["La Cha Ta", "f(x)", "La Cha Ta", 2009],
  ["NU ABO", "f(x)", "Nu Abo", 2010],
  ["Pinocchio (Danger)", "f(x)", "Pinocchio", 2011],
  ["Hot Summer", "f(x)", "Hot Summer", 2011],
  ["Electro Shock", "f(x)", "Electric Shock", 2012],
  ["Rum Pum Pum Pum", "f(x)", "Pink Tape", 2013],
  ["Red Light", "f(x)", "Red Light", 2014],
  ["4 Walls", "f(x)", "4 Walls", 2015],
  ["New Tomorrow", "Fantasy Boys", "NEW TOMORROW", 2023],
  ["Get It On", "Fantasy Boys", "Potential", 2023],
  ["Make Sunshine", "Fantasy Boys", "MAKE SUNSHINE", 2024],
  ["Undeniable", "Fantasy Boys", "UNDENIABLE", 2025],
  ["Beautiful", "Amber", "Beautiful", 2015],
  ["Free Somebody", "Luna", "Free Somebody", 2016],
  ["Around The World", "GOT7", "Around The World", 2014],
  ["Girls Girls Girls", "GOT7", "Got It?", 2014],
  ["A", "GOT7", "Got♥", 2014],
  ["Stop Stop It", "GOT7", "Identify", 2014],
  ["Love Train", "GOT7", "Love Train", 2015],
  ["Just Right", "GOT7", "Just Right", 2015],
  ["Laugh Laugh Laugh", "GOT7", "Laugh Laugh Laugh", 2015],
  ["If You Do", "GOT7", "MAD", 2015],
  ["Fly", "GOT7", "Flight Log : Departure", 2016],
  ["Home Run", "GOT7", "Home Run", 2016],
  ["Hard Carry", "GOT7", "Flight Log : Turbulence", 2016],
  ["Never Stop", "GOT7", "Hey Yah", 2016],
  ["Never Ever", "GOT7", "Flight Log : Arrival", 2017],
  ["My Swagger", "GOT7", "My Swagger", 2017],
  ["You Are", "GOT7", "7 for 7", 2017],
  ["Turn Up", "GOT7", "Turn Up", 2017],
  ["Look", "GOT7", "Eyes On You", 2018],
  ["The New Era", "GOT7", "The New Era", 2018],
  ["Lullaby", "GOT7", "Present : YOU", 2018],
  ["Miracle", "GOT7", "Present : You & Me Edition", 2018],
  ["I Won't Let You Go", "GOT7", "I Won't Let You Go", 2019],
  ["1 Degree", "GOT7", "Spinning Top", 2019],
  ["Love Loop", "GOT7", "Love Loop", 2019],
  ["Sing for U", "GOT7", "Sing for U", 2019],
  ["You Calling My Name", "GOT7", "Call My Name", 2019],
  ["Aura", "GOT7", "DYE", 2020],
  ["Breath", "GOT7", "Breath of Love", 2020],
  ["Encore", "GOT7", "Encore", 2021],
  ["Truth", "GOT7", "GOT7", 2022],
  ["Winter Heptagon", "GOT7", "Winter Heptagon", 2025],
  ["Into the New World", "Girls' Generation", "Into the New World", 2007],
  ["Girls' Generation", "Girls' Generation", "Girls' Generation", 2007],
  ["Gee", "Girls' Generation", "Gee", 2009],
  ["Genie", "Girls' Generation", "Tell Me Your Wish", 2009],
  ["Oh!", "Girls' Generation", "Oh!", 2010],
  ["Hoot", "Girls' Generation", "Hoot", 2010],
  ["MR. TAXI", "Girls' Generation", "Girls' Generation (Japanese)", 2011],
  ["The Boys", "Girls' Generation", "The Boys", 2011],
  ["Flower Power", "Girls' Generation", "Girls & Peace", 2012],
  ["I Got A Boy", "Girls' Generation", "I Got A Boy", 2013],
  ["Gossip Girls", "Girls' Generation", "Love & Peace", 2013],
  ["Mr.Mr.", "Girls' Generation", "Mr.Mr.", 2014],
  ["Catch Me If You Can", "Girls' Generation", "Catch Me If You Can", 2015],
  ["Lion Heart", "Girls' Generation", "Lion Heart", 2015],
  ["Girls Are Back", "Girls' Generation", "Holiday Night", 2017],
  ["Forever 1", "Girls' Generation", "Forever 1", 2022],
  ["Glass Bead", "GFRIEND", "Season of Glass", 2015],
  ["Me Gustas Tú", "GFRIEND", "Flower Bud", 2015],
  ["Rough", "GFRIEND", "Snowflake", 2016],
  ["Fever", "GFRIEND", "LOL", 2016],
  ["Fingertip", "GFRIEND", "The Awakening", 2017],
  ["Love Whisper", "GFRIEND", "Parallel", 2017],
  ["Rainbow", "GFRIEND", "Rainbow", 2017],
  ["Time for the Moon Night", "GFRIEND", "Time for the Moon Night", 2018],
  ["Sunny Summer", "GFRIEND", "Sunny Summer", 2018],
  ["Sunrise", "GFRIEND", "Time for Us", 2019],
  ["Flower", "GFRIEND", "Flower", 2019],
  ["Crossroads", "GFRIEND", "Labyrinth", 2020],
  ["Apple", "GFRIEND", "Song of the Sirens", 2020],
  ["Mago", "GFRIEND", "Walpurgis Night", 2020],
  ["Puzzle Moon", "GWSN", "The Park in the Night Part.1", 2018],
  ["Pinky Star", "GWSN", "The Park in the Night Part.2", 2019],
  ["Red-Sun", "GWSN", "The Park in the Night Part.3", 2019],
  ["Bazooka!", "GWSN", "The Keys", 2020],
  ["Like It Hot", "GWSN", "The Other Side of the Moon", 2021],
  ["Commas", "GIRLSET", "Commas", 2025],
  ["Little Miss", "GIRLSET", "Little Miss", 2025],
  ["Tweak", "GIRLSET", "Tweak", 2026],
  ["Chat", "GIRLSET", "Chat", 2026],
  ["Bounce", "JJ Project", "Verse 2", 2012],
  ["Coming Home", "JJ Project", "Verse 2", 2017],
  ["Focus on Me", "Jus2", "Focus", 2019],
  ["Switch It Up", "Jay B", "Switch It Up", 2021],
  ["B.T.W", "Jay B", "SOMO: FUME", 2021],
  ["Dive into You", "Jay B", "Dive into You", 2021],
  ["Rocking Chair", "Jay B", "Rocking Chair", 2022],
  ["Be Yourself", "Jay B", "Be Yourself", 2022],
  ["Road Runner", "Jay B", "Archive 1: Road Runner", 2024],
  ["Never Told You", "Mark Tuan", "Never Told You", 2020],
  ["One in a Million", "Mark Tuan", "One in a Million", 2021],
  ["IMYSM", "Mark Tuan", "IMYSM", 2022],
  ["Outta My Mind", "Mark Tuan", "The Other Side", 2022],
  ["Carry Me Out", "Mark Tuan", "Carry Me Out", 2023],
  ["Your World", "Mark Tuan", "Your World", 2023],
  ["Papillon", "Jackson Wang", "Papillon", 2017],
  ["Okay", "Jackson Wang", "Okay", 2017],
  ["Dawn of Us", "Jackson Wang", "Dawn of Us", 2018],
  ["Fendiman", "Jackson Wang", "Fendiman", 2018],
  ["Different Game", "Jackson Wang", "Different Game", 2018],
  ["Oxygen", "Jackson Wang", "Oxygen", 2019],
  ["Bullet to the Heart", "Jackson Wang", "Mirrors", 2019],
  ["100 Ways", "Jackson Wang", "100 Ways", 2020],
  ["Pretty Please", "Jackson Wang", "Pretty Please", 2020],
  ["Alone", "Jackson Wang", "Alone", 2021],
  ["LMLY", "Jackson Wang", "LMLY", 2021],
  ["Blow", "Jackson Wang", "Magic Man", 2022],
  ["Cheetah", "Jackson Wang", "Cheetah", 2023],
  ["Feeling Lucky", "Jackson Wang", "Feeling Lucky", 2024],
  ["Henny", "Jackson Wang", "Henny", 2024],
  ["High Alone", "Jackson Wang", "High Alone", 2025],
  ["DIVE", "Jinyoung", "DIVE", 2021],
  ["Letter", "Jinyoung", "Chapter 0: With", 2023],
  ["Vibin", "Youngjae", "Colors from Ars", 2021],
  ["Closest", "Youngjae", "Sugaring", 2022],
  ["Errr Day", "Youngjae", "Errr Day", 2023],
  ["Do It", "Youngjae", "Do It", 2023],
  ["riBBon", "BamBam", "riBBon", 2021],
  ["Who Are You", "BamBam", "B", 2021],
  ["Sour & Sweet", "BamBam", "Sour & Sweet", 2023],
  ["BAMESIS", "BamBam", "BAMESIS", 2024],
  ["All Your Fault", "Yugyeom", "Point Of View: U", 2021],
  ["Take You Down", "Yugyeom", "Take You Down", 2022],
  ["Ponytail", "Yugyeom", "Ponytail", 2023],
  ["Trust Me", "Yugyeom", "Trust Me", 2024],
  ["Wonderland", "gugudan", "Act.1 The Little Mermaid", 2016],
  ["Rainbow", "gugudan", "Act.2 Narcissus", 2017],
  ["Chococo", "gugudan", "Act.3 Chococo Factory", 2017],
  ["The Boots", "gugudan", "Act.4 Cait Sith", 2018],
  ["Not That Type", "gugudan", "Act.5 New Action", 2018],
  ["Party (XXO)", "GLAM", "Party (XXO)", 2012],
  ["Bad Girl", "GLAM", "Bad Girl", 2013],
  ["Step Back", "GOT the beat", "Step Back", 2022],
  ["Stamp On It", "GOT the beat", "Stamp On It", 2023],
  ["DamDaDi", "Golden Child", "Gol-Cha!", 2017],
  ["It's U", "Golden Child", "Miracle", 2018],
  ["Let Me", "Golden Child", "Goldenness", 2018],
  ["Genie", "Golden Child", "WISH", 2018],
  ["Wannabe", "Golden Child", "Re-boot", 2019],
  ["ONE (Lucid Dream)", "Golden Child", "Take A Leap", 2020],
  ["That Guy", "Golden Child", "Pump It Up", 2020],
  ["Ans", "Golden Child", "YES.", 2021],
  ["Ra Pam Pam", "Golden Child", "Game Changer", 2021],
  ["DDARA", "Golden Child", "DDARA", 2021],
  ["A WOO!!", "Golden Child", "A WOO!!", 2022],
  ["RATA-TAT-TAT", "Golden Child", "RATA-TAT-TAT", 2022],
  ["AURA", "Golden Child", "AURA", 2022],
  ["Invisible Crayon", "Golden Child", "Invisible Crayon", 2023],
  ["Feel me", "Golden Child", "Feel me", 2023],
  ["CGOT", "Golden Child", "CGOT", 2025],
  ["Vision", "Ghost9", "Pre Episode 1", 2020],
  ["W.All", "Ghost9", "Pre Episode 2", 2020],
  ["Control", "Ghost9", "Now : Where we are, here", 2021],
  ["Trigger", "Ghost9", "Now : Who we are facing", 2021],
  ["Intro : In to the Blue", "Ghost9", "Now : Passage", 2021],
  ["X-Ray", "Ghost9", "Arcade : V", 2022],
  ["ARCADE", "Ghost9", "ARCADE : O", 2022],
  ["Supernatural", "Ghost9", "Supernatural", 2024],
  ["Sparkle", "Hearts2Hearts", "Heartfelt", 2025],
  ["Neon City", "Hearts2Hearts", "Neon Nights", 2025],
  ["Supernova", "Hearts2Hearts", "Supernova", 2026],
  ["Warrior's Descendant", "H.O.T.", "We Hate All Kinds of Violence", 1996],
  ["Wolf and Sheep", "H.O.T.", "Wolf and Sheep", 1997],
  ["Hope", "H.O.T.", "Resurrection", 1998],
  ["I Yah!", "H.O.T.", "I Yah!", 1999],
  ["Outside Castle", "H.O.T.", "Outside Castle", 2000],
  ["Venus", "HELLOVENUS", "Venus", 2012],
  ["What Are You Doing Today?", "HELLOVENUS", "What Are You Doing Today?", 2012],
  ["Would You Stay for Tea?", "HELLOVENUS", "Would You Stay for Tea?", 2013],
  ["Wiggle Wiggle", "HELLOVENUS", "Wiggle Wiggle", 2015],
  ["I'm Ill", "HELLOVENUS", "I'm Ill", 2015],
  ["Runway", "HELLOVENUS", "Mystery of VENUS", 2017],
  ["Fever", "HALO", "38°C", 2014],
  ["Hello Again", "HALO", "Hello Again", 2014],
  ["Surprise", "HALO", "Hello Miracle", 2015],
  ["Growing Pains", "HALO", "Growing Pains", 2015],
  ["Ouch", "HALO", "Ouch", 2015],
  ["Maria", "HALO", "Here I Am", 2016],
  ["Jungguk", "HALO", "Gods", 2017],
  ["Beware", "HALO", "Beware", 2017],
  ["Vista", "FIESTAR", "Vista", 2012],
  ["We Don't Stop", "FIESTAR", "We Don't Stop", 2012],
  ["I Don't Know", "FIESTAR", "Curious", 2013],
  ["One More", "FIESTAR", "One More", 2014],
  ["You're Pitiful", "FIESTAR", "Black Label", 2015],
  ["A Sip Of Lips", "FIESTAR", "A Delicate Sense", 2016],
  ["Apple Pie", "FIESTAR", "Apple Pie", 2016],
  ["Athletic Girl", "H1-KEY", "Athletic Girl", 2022],
  ["RUN", "H1-KEY", "RUN", 2022],
  ["Rose Blossom", "H1-KEY", "Rose Blossom", 2023],
  ["Time to Shine", "H1-KEY", "Seoul Dreaming", 2023],
  ["Airplane", "H1-KEY", "Airplane", 2024],
  ["Let It Burn", "H1-KEY", "LOVE or HATE", 2024],
  ["Summer Was You", "H1-KEY", "Lovestruck", 2025],
  ["Not Like a Movie", "H1-KEY", "Lovechapter", 2026],
  ["Dreamer", "HISTORY", "Blue Spring", 2013],
  ["The Last Time", "HISTORY", "Just Now", 2013],
  ["Need You", "HISTORY", "Desire", 2014],
  ["Might Just Die", "HISTORY", "Beyond the HISTORY", 2015],
  ["Wild Boy", "HISTORY", "HIM", 2016],
  ["Take a Shot", "HOTSHOT", "Take a Shot", 2014],
  ["Midnight Sun", "HOTSHOT", "Am I Hotshot?", 2015],
  ["I'm a Hotshot", "HOTSHOT", "I'm a Hotshot", 2015],
  ["Jelly", "HOTSHOT", "Early Flowering", 2018],
  ["Dream Girls", "I.O.I", "Chrysalis", 2016],
  ["Whatta Man", "I.O.I", "Whatta Man", 2016],
  ["Very Very Very", "I.O.I", "miss me?", 2016],
  ["Downpour", "I.O.I", "Downpour", 2017],
  ["Suddenly", "I.O.I", "I.O.I : LOOP", 2026],
  ["Dalla Dalla", "ITZY", "IT'z Different", 2019],
  ["ICY", "ITZY", "IT'z ICY", 2019],
  ["WANNABE", "ITZY", "IT'z ME", 2020],
  ["Not Shy", "ITZY", "Not Shy", 2020],
  ["Loco", "ITZY", "CRAZY IN LOVE", 2021],
  ["Sneakers", "ITZY", "CHECKMATE", 2022],
  ["Cheshire", "ITZY", "CHESHIRE", 2022],
  ["Cake", "ITZY", "KILL MY DOUBT", 2023],
  ["Untouchable", "ITZY", "BORN TO BE", 2024],
  ["Gold", "ITZY", "GOLD", 2024],
  ["AIR", "ITZY", "AIR", 2025],
  ["Girls Will Be Girls", "ITZY", "Girls Will Be Girls", 2025],
  ["TUNNEL VISION", "ITZY", "TUNNEL VISION", 2025],
  ["Ice Cream", "ITZY", "Ice Cream", 2026],
  ["Motto", "ITZY", "Motto", 2026],
  ["Eleven", "IVE", "ELEVEN", 2021],
  ["Love Dive", "IVE", "LOVE DIVE", 2022],
  ["After Like", "IVE", "After LIKE", 2022],
  ["Kitsch", "IVE", "I've IVE", 2023],
  ["Baddie", "IVE", "I'VE MINE", 2023],
  ["HEYA", "IVE", "IVE SWITCH", 2024],
  ["Echo", "IVE", "Echo", 2025],
  ["Immernoch", "IVE", "Immernoch", 2025],
  ["Be Alright", "IVE", "Be Alright", 2025],
  ["Echobeat", "IVE", "Echobeat", 2025],
  ["REVIVE+", "IVE", "REVIVE+", 2026],
  ["Lost Child", "IU", "Lost and Found", 2008],
  ["Good Day", "IU", "Real", 2010],
  ["You and I", "IU", "Last Fantasy", 2011],
  ["The Red Shoes", "IU", "Modern Times", 2013],
  ["Twenty-Three", "IU", "CHAT-SHIRE", 2015],
  ["Through the Night", "IU", "Palette", 2017],
  ["BBI BBI", "IU", "BBI BBI", 2018],
  ["Blueming", "IU", "Love poem", 2019],
  ["Eight", "IU", "Eight", 2020],
  ["Celebrity", "IU", "LILAC", 2021],
  ["Lilac", "IU", "LILAC", 2021],
  ["Strawberry Moon", "IU", "Strawberry Moon", 2021],
  ["Love wins all", "IU", "The Winning", 2024],
  ["My Type", "iKON", "Welcome Back", 2015],
  ["Rhythm Ta", "iKON", "Welcome Back", 2015],
  ["Bling Bling", "iKON", "New Kids : Begin", 2017],
  ["Love Scenario", "iKON", "Return", 2018],
  ["Killing Me", "iKON", "New Kids : Continue", 2018],
  ["Why Why Why", "iKON", "Why Why Why", 2021],
  ["But You", "iKON", "Flashback", 2022],
  ["Full House", "MOBB", "The MOBB", 2016],
  ["Holup!", "Bobby", "Love and Fall", 2016],
  ["I Love You", "Bobby", "Love and Fall", 2017],
  ["U Mad", "Bobby", "Lucky Man", 2021],
  ["Rest Your Bones", "Bobby", "S.i.R", 2023],
  ["Why Don't You Know", "Chung Ha", "Hands on Me", 2017],
  ["Roller Coaster", "Chung Ha", "Offset", 2018],
  ["Love U", "Chung Ha", "Blooming Blue", 2018],
  ["Gotta Go", "Chung Ha", "Gotta Go", 2019],
  ["Snapping", "Chung Ha", "Flourishing", 2019],
  ["Stay Tonight", "Chung Ha", "Querencia", 2020],
  ["Sparkling", "Chung Ha", "Bare & Rare", 2022],
  ["Crown On My Head", "Yeji", "BORN TO BE", 2024],
  ["Blossom", "Lia", "BORN TO BE", 2024],
  ["Run Away", "Ryujin", "BORN TO BE", 2024],
  ["Mine", "Chaeryeong", "BORN TO BE", 2024],
  ["Yet, but", "Yuna", "BORN TO BE", 2024],
  ["Pocket", "Yeji", "Motto", 2026],
  ["Asylum", "Lia", "Motto", 2026],
  ["LOOK", "Ryujin", "Motto", 2026],
  ["Undefined", "Chaeryeong", "Motto", 2026],
  ["Tangerine", "Yuna", "Motto", 2026],
  ["Eight", "Wonyoung", "REVIVE+", 2026],
  ["In Your Heart", "Rei", "REVIVE+", 2026],
  ["Unreal", "Liz", "REVIVE+", 2026],
  ["ODD", "Gaeul", "REVIVE+", 2026],
  ["Super Icy", "Leeseo", "REVIVE+", 2026],
  ["Force", "Yujin", "REVIVE+", 2026],
  ["Flower Way", "Kim Sejeong", "Jelly Box Flower Way", 2016],
  ["Plant", "Kim Sejeong", "Plant", 2020],
  ["Whale", "Kim Sejeong", "Whale", 2020],
  ["Warning", "Kim Sejeong", "I'm", 2021],
  ["Baby I Love U", "Kim Sejeong", "Baby I Love U", 2021],
  ["Voyage", "Kim Sejeong", "Door", 2023],
  ["Solar System", "Kim Sejeong", "Solar System", 2025],
  ["Birthday", "Jeon Somi", "Birthday", 2019],
  ["What You Waiting For", "Jeon Somi", "What You Waiting For", 2020],
  ["Dumb Dumb", "Jeon Somi", "Dumb Dumb", 2021],
  ["XOXO", "Jeon Somi", "XOXO", 2021],
  ["Fast Forward", "Jeon Somi", "Game Plan", 2023],
  ["Ice Cream", "Jeon Somi", "Ice Cream", 2024],
  ["Extra", "Jeon Somi", "Extra", 2025],
  ["Closer", "Jeon Somi", "Chaotic & Confused", 2025],
  ["Moonboy", "Jeon Somi", "Moonboy", 2026],
  ["La Vie en Rose", "IZONE", "COLORIZ", 2018],
  ["Suki to Iwasetai", "IZONE", "Suki to Iwasetai", 2019],
  ["Airplane", "IZONE", "HEARTIZ", 2019],
  ["Vampire", "IZONE", "Vampire", 2019],
  ["Buenos Aires", "IZONE", "Buenos Aires", 2019],
  ["Eyes", "IZONE", "BLOOMIZ", 2020],
  ["Secret Story of the Swan", "IZONE", "Oneiric Diary", 2020],
  ["Panorama", "IZONE", "One-reeler", 2020],
  ["D-D-Dance", "IZONE", "D-D-Dance", 2021],
  ["Zero Attitude", "IZONE", "Zero Attitude", 2021],
  ["Parallel Universe", "IZONE", "Parallel Universe", 2021],
  ["I.Z.N.A", "izna", "N/a", 2024],
  ["IZNA", "izna", "Not Just a Girl", 2024],
  ["BEEP", "izna", "BEEP", 2025],
  ["Shine Out", "izna", "Shine Out", 2025],
  ["Wildflower", "izna", "Wildflower", 2026],
  ["Neon Glow", "izna", "Neon Glow", 2026],
  ["At First", "JJCC", "JJCC 1st Single Album", 2014],
  ["Bing Bing Bing", "JJCC", "Bing Bing Bing", 2014],
  ["Fire", "JJCC", "Fire", 2015],
  ["Where You At", "JJCC", "Ackmong", 2015],
  ["Infighter", "JO1", "PROTOSTAR", 2020],
  ["Shine A Light", "JO1", "The STAR", 2020],
  ["STRANGER", "JO1", "STRANGER", 2021],
  ["MIDNIGHT SUN", "JO1", "MIDNIGHT SUN", 2022],
  ["TROPICAL NIGHT", "JO1", "TROPICAL NIGHT", 2023],
  ["HITCHHIKER", "JO1", "HITCHHIKER", 2024],
  ["Midnight Falls", "JO1", "Midnight Falls", 2025],
  ["Eternal", "JO1", "Eternal", 2026],
  ["J-So", "JO1 Unit", "Eternal", 2026],
  ["DAMAGE", "JUSTB", "JUST BURN", 2021],
  ["Double Dare", "JUSTB", "JUST BEGUN", 2022],
  ["Me = (Minus)", "JUSTB", "ME= (Minus)", 2022],
  ["Medusa", "JUSTB", "CONTRASTS", 2023],
  ["Stay", "JUSTB", "STAY", 2024],
  ["RE:MIND", "JUSTB", "RE:MIND", 2024],
  ["Aurora", "JUSTB", "AURORA", 2025],
  ["Eclipse", "JUSTB", "Eclipse", 2026],
  ["Solo: Reflection", "Lim Jimin", "AURORA", 2025],
  ["The Flash", "Kwon Eunbi", "The Flash", 2023],
  ["SABOTAGE", "Kwon Eunbi", "SABOTAGE", 2024],
  ["Tailored", "Kwon Eunbi", "Tailored", 2025],
  ["Chasing Waterfalls", "Kwon Eunbi", "Chasing Waterfalls", 2025],
  ["Magnetic", "Kwon Eunbi", "Magnetic", 2026],
  ["Good Girls in the Dark", "Choi Ye-na", "GOOD GIRLS IN THE DARK", 2024],
  ["Bad Girls Club", "Choi Ye-na", "Bad Girls Club", 2025],
  ["Blooming", "Choi Ye-na", "Blooming", 2025],
  ["Sugar Rush", "Choi Ye-na", "Sugar Rush", 2026],
  ["The Other Side", "Jo Yu-ri", "The Other Side", 2024],
  ["Op.22", "Jo Yu-ri", "Op.22", 2024],
  ["Nightmare", "Jo Yu-ri", "Nightmare", 2025],
  ["Eternity", "Jo Yu-ri", "Eternity", 2026],
  ["Don't", "Lee Chaeyeon", "Showdown", 2024],
  ["Summer Heat", "Lee Chaeyeon", "Summer Heat", 2025],
  ["Running Time", "Lee Chaeyeon", "Running Time", 2025],
  ["Fadeaway", "Lee Chaeyeon", "Fadeaway", 2026],
  ["Found You", "JYJ", "The Beginning", 2010],
  ["In Heaven", "JYJ", "In Heaven", 2011],
  ["Back Seat", "JYJ", "Just Us", 2014],
  ["Debut", "KATSEYE", "SIS", 2024],
  ["Gnarly", "KATSEYE", "Gnarly", 2025],
  ["Gabriela", "KATSEYE", "Gabriela", 2025],
  ["Astronaut", "KATSEYE", "Be Strong", 2025],
  ["Siren", "KATSEYE", "Siren", 2026],
  ["Intro", "KiiiKiii", "KiiiKiii", 2025],
  ["Sweet Dream", "KiiiKiii", "Sweet Dream", 2025],
  ["Make It Bounce", "KiiiKiii", "Make It Bounce", 2026],
  ["Flip It", "KickFlip", "KickStart", 2025],
  ["Game Over", "KickFlip", "Game Over", 2025],
  ["Adrenaline", "KickFlip", "Adrenaline", 2026],
  ["Oh NaNa", "KARD", "Hola Hola", 2016],
  ["Hola Hola", "KARD", "Hola Hola", 2017],
  ["You In Me", "KARD", "You & Me", 2017],
  ["Ride on the Wind", "KARD", "Ride on the Wind", 2018],
  ["Bomb Bomb", "KARD", "Bomb Bomb", 2019],
  ["Red Moon", "KARD", "Red Moon", 2020],
  ["Gunshot", "KARD", "Way with Words", 2020],
  ["Ring The Alarm", "KARD", "Re:", 2022],
  ["Icky", "KARD", "ICKY", 2023],
  ["Tell My Momma", "KARD", "Where To Now?", 2024],
  ["Higher", "KARD", "Higher", 2025],
  ["Pulse", "KARD", "Pulse", 2025],
  ["Neon Lights", "KARD", "Neon Lights", 2026],
  ["POP/STARS", "K/DA", "POP/STARS", 2018],
  ["The Baddest", "K/DA", "ALL OUT", 2020],
  ["More", "K/DA", "ALL OUT", 2020],
  ["Villain", "K/DA", "ALL OUT", 2020],
  ["I'll Show You", "K/DA", "ALL OUT", 2020],
  ["Drum Go Dum", "K/DA", "ALL OUT", 2020],
  ["Signal", "Keyveats", "Interference", 2024],
  ["Knock", "KNK", "Awake", 2016],
  ["Back Again", "KNK", "Remain", 2016],
  ["Sun, Moon, Star", "KNK", "GRAVITY", 2017],
  ["Lonely Night", "KNK", "Lonely Night", 2019],
  ["Sunset", "KNK", "Line Up", 2019],
  ["Ride", "KNK", "Gravity", 2020],
  ["The World Is My Oyster", "LE SSERAFIM", "FEARLESS", 2022],
  ["Antifragile", "LE SSERAFIM", "ANTIFRAGILE", 2022],
  ["Unforgiven", "LE SSERAFIM", "UNFORGIVEN", 2023],
  ["Perfect Night", "LE SSERAFIM", "Perfect Night", 2023],
  ["Easy", "LE SSERAFIM", "EASY", 2024],
  ["CRAZY", "LE SSERAFIM", "CRAZY", 2024],
  ["HOT", "LE SSERAFIM", "HOT", 2025],
  ["SPARK", "LE SSERAFIM", "SPARK", 2025],
  ["AURA", "LE SSERAFIM", "AURA", 2026],
  ["I ≠ Doll", "Yunjin", "I ≠ Doll", 2023],
  ["Love You Twice", "Yunjin", "Love You Twice", 2023],
  ["Blessing in Disguise", "Yunjin", "Blessing in Disguise", 2023],
  ["Choices", "Sakura", "UNFORGIVEN (Japanese Edition)", 2023],
  ["Hi High", "LOONA", "+ +", 2018],
  ["Butterfly", "LOONA", "x x", 2019],
  ["So What", "LOONA", "Hash", 2020],
  ["Star", "LOONA", "Midnight", 2020],
  ["PTT", "LOONA", "&", 2021],
  ["Flip That", "LOONA", "Flip That", 2022],
  ["Love & Live", "LOONA 1/3", "Love & Live", 2017],
  ["Sonatine", "LOONA 1/3", "Love & Evil", 2017],
  ["Girl Front", "Odd Eye Circle", "Mix & Match", 2017],
  ["Je Ne Sais Quoi", "Odd Eye Circle", "Version Up", 2023],
  ["love4eva", "LOONA yyxy", "Beauty & the Beat", 2018],
  ["Sensitive", "Loossemble", "Loossemble", 2023],
  ["Girls' Night", "Loossemble", "One of a Kind", 2024],
  ["TTYL", "Loossemble", "TTYL", 2024],
  ["Birth", "ARTMS", "Dall", 2024],
  ["Icarus", "ARTMS", "Icarus", 2025],
  ["From Wings To Soul", "ARTMS", "From Wings To Soul", 2026],
  ["Howl", "Chuu", "Howl", 2023],
  ["Strawberry Rush", "Chuu", "Strawberry Rush", 2024],
  ["Only Cry in the Rain", "Chuu", "Only Cry in the Rain", 2025],
  ["XO, My Cyberlove", "Chuu", "XO, My Cyberlove", 2026],
  ["Rule", "Chuu", "Rule", 2026],
  ["Loop", "Yves", "Loop", 2024],
  ["Tik Tok", "Yves", "I Did", 2024],
  ["White Cat", "Yves", "Soft Error", 2025],
  ["Ex Machina", "Yves", "Soft Error: X", 2025],
  ["Nail", "Yves", "Nail", 2026],
  ["Mr. Ambiguous", "Mamamoo", "Hello", 2014],
  ["Hi Hiya Hayo", "Mamamoo", "Hello", 2014],
  ["Don't Be Happy (feat. Bumkey)", "Mamamoo", "Hello", 2014],
  ["Peppermint Chocolate (with K.Will feat. Wheesung)", "Mamamoo", "Hello", 2014],
  ["Baton Touch", "Mamamoo", "Hello", 2014],
  ["Gentleman (with Esna)", "Mamamoo", "Piano Man", 2014],
  ["Piano Man", "Mamamoo", "Piano Man", 2014],
  ["Ahh Oop! (with eSNa)", "Mamamoo", "Pink Funky", 2015],
  ["Freakin Shoes", "Mamamoo", "Pink Funky", 2015],
  ["Um Oh Ah Yeh", "Mamamoo", "Pink Funky", 2015],
  ["Stingy", "Mamamoo", "Pink Funky", 2015],
  ["Girl Crush", "Mamamoo", "Pink Funky", 2015],
  ["Taller Than You", "Mamamoo", "Melting", 2016],
  ["You're the Best", "Mamamoo", "Melting", 2016],
  ["Words Don't Come Easy", "Mamamoo", "Melting", 2016],
  ["Our Friendship Belongs to Everyone", "Mamamoo", "Melting", 2016],
  ["Cat Fight", "Mamamoo", "Melting", 2016],
  ["Just", "Mamamoo", "Melting", 2016],
  ["Girl's Way", "Mamamoo", "Melting", 2016],
  ["Homerun", "Mamamoo", "Melting", 2016],
  ["Memory", "Mamamoo", "Memory", 2016],
  ["Décalcomanie", "Mamamoo", "Memory", 2016],
  ["New York", "Mamamoo", "Memory", 2016],
  ["Moderato", "Mamamoo", "Memory", 2016],
  ["Angel", "Mamamoo", "Memory", 2016],
  ["Dab Dab", "Mamamoo", "Memory", 2016],
  ["Byul See You Again", "Mamamoo", "Purple", 2017],
  ["Yes I Am", "Mamamoo", "Purple", 2017],
  ["Finally", "Mamamoo", "Purple", 2017],
  ["Love & Hate", "Mamamoo", "Purple", 2017],
  ["A Poem of a Lonely Mind", "Mamamoo", "Purple", 2017],
  ["Starry Night", "Mamamoo", "Yellow Flower", 2018],
  ["Be Calm", "Mamamoo", "Yellow Flower", 2018],
  ["Rude Boy", "Mamamoo", "Yellow Flower", 2018],
  ["Spring Fever", "Mamamoo", "Yellow Flower", 2018],
  ["Paint Me", "Mamamoo", "Yellow Flower", 2018],
  ["Egotistic", "Mamamoo", "Red Moon", 2018],
  ["Midnight Summer Dream", "Mamamoo", "Red Moon", 2018],
  ["Sleep in the Car", "Mamamoo", "Red Moon", 2018],
  ["Blue Moon", "Mamamoo", "Red Moon", 2018],
  ["Sky! Sky!", "Mamamoo", "Red Moon", 2018],
  ["Helloes", "Mamamoo", "Red Moon", 2018],
  ["Wind Flower", "Mamamoo", "Blue;s", 2018],
  ["Where R U", "Mamamoo", "Blue;s", 2018],
  ["Gogobebe", "Mamamoo", "White Wind", 2019],
  ["Bad Bye", "Mamamoo", "White Wind", 2019],
  ["My Star", "Mamamoo", "White Wind", 2019],
  ["4x4ever", "Mamamoo", "White Wind", 2019],
  ["Hip", "Mamamoo", "Reality in Black", 2019],
  ["Destiny", "Mamamoo", "Reality in Black", 2019],
  ["Universe", "Mamamoo", "Reality in Black", 2019],
  ["Ten Nights", "Mamamoo", "Reality in Black", 2019],
  ["Better", "Mamamoo", "Reality in Black", 2019],
  ["Hello Mama", "Mamamoo", "Reality in Black", 2019],
  ["ZzZz", "Mamamoo", "Reality in Black", 2019],
  ["Reality", "Mamamoo", "Reality in Black", 2019],
  ["Dingga", "Mamamoo", "Travel", 2020],
  ["Aya", "Mamamoo", "Travel", 2020],
  ["Diamond", "Mamamoo", "Travel", 2020],
  ["Good Night", "Mamamoo", "Travel", 2020],
  ["Where Are We Now", "Mamamoo", "WAW", 2021],
  ["Without You", "Mamamoo", "WAW", 2021],
  ["Let's Talk About Love", "Mamamoo", "WAW", 2021],
  ["Stranger", "Mamamoo", "WAW", 2021],
  ["Mumumumuch", "Mamamoo", "I Say Mamamoo : The Best", 2021],
  ["ILLELLA", "Mamamoo", "Mic Drop / 1, 2, 3", 2022],
  ["When This Song Is Over", "Mamamoo", "Mic Drop", 2022],
  ["Arrow", "Mamamoo", "Mic Drop", 2022],
  ["HEART", "Mamamoo", "HEART", 2024],
  ["GLOW", "Mamamoo", "GLOW", 2025],
  ["Oh Yeah", "MBLAQ", "Just BLAQ", 2009],
  ["G.O.O.D Intro", "MBLAQ", "Just BLAQ", 2009],
  ["My Dream", "MBLAQ", "Just BLAQ", 2009],
  ["Y", "MBLAQ", "Y", 2010],
  ["One Better Day", "MBLAQ", "Y", 2010],
  ["What U Want", "MBLAQ", "Y", 2010],
  ["Stay", "MBLAQ", "BLAQ Style", 2011],
  ["Cry", "MBLAQ", "BLAQ Style", 2011],
  ["Darling", "MBLAQ", "BLAQ Style", 2011],
  ["You're My Girl", "MBLAQ", "BLAQ Style", 2011],
  ["Mona Lisa", "MBLAQ", "Mona Lisa", 2011],
  ["O Yeah", "MBLAQ", "Mona Lisa", 2011],
  ["Run", "MBLAQ", "Mona Lisa", 2011],
  ["This Is War", "MBLAQ", "100% Ver.", 2012],
  ["Padam Padam", "MBLAQ", "100% Ver.", 2012],
  ["Smoky Girl", "MBLAQ", "Sexy Beat", 2013],
  ["Rendezvous", "MBLAQ", "Sexy Beat", 2013],
  ["Be A Man", "MBLAQ", "Broken", 2014],
  ["Our Relationship", "MBLAQ", "Broken", 2014],
  ["Spring Summer Fall and...", "MBLAQ", "Winter", 2014],
  ["Mirror", "MBLAQ", "Mirror", 2015],
  ["Top Gang", "MCND", "into the ICE AGE", 2020],
  ["Ice Age", "MCND", "into the ICE AGE", 2020],
  ["Stereotype", "MCND", "into the ICE AGE", 2020],
  ["Up in the Sky", "MCND", "into the ICE AGE", 2020],
  ["Beautiful", "MCND", "into the ICE AGE", 2020],
  ["Spring", "MCND", "Earth Age", 2020],
  ["Nanana", "MCND", "Earth Age", 2020],
  ["Breathe", "MCND", "Earth Age", 2020],
  ["Galaxy", "MCND", "Earth Age", 2020],
  ["Not Over", "MCND", "Earth Age", 2020],
  ["Crush", "MCND", "MCND AGE", 2021],
  ["Labyrinth", "MCND", "MCND AGE", 2021],
  ["Outro", "MCND", "MCND AGE", 2021],
  ["Movin'", "MCND", "The Earth: Secret Mission Chapter.1", 2021],
  ["Permission", "MCND", "The Earth: Secret Mission Chapter.1", 2021],
  ["Reason", "MCND", "The Earth: Secret Mission Chapter.1", 2021],
  ["Cat Waltz", "MCND", "The Earth: Secret Mission Chapter.1", 2021],
  ["Woke Up", "MCND", "The Earth: Secret Mission Chapter.2", 2022],
  ["Paradox", "MCND", "The Earth: Secret Mission Chapter.2", 2022],
  ["HTG", "MCND", "The Earth: Secret Mission Chapter.2", 2022],
  ["Good Day", "MCND", "The Earth: Secret Mission Chapter.2", 2022],
  ["ODD-V", "MCND", "ODD-V", 2023],
  ["X10", "MCND", "X10", 2023],
  ["The Drop", "MCND", "The Drop", 2024],
  ["Elevate", "MCND", "Elevate", 2025],
  ["Run Wild", "MCND", "Run Wild", 2025],
  ["UNO", "MADEIN", "MADEIN", 2024],
  ["DART", "MADEIN", "MADEIN", 2024],
  ["NotFound", "MADEIN", "NotFound", 2025],
  ["Electric Love", "MADEIN", "Electric Love", 2025],
  ["Supernova", "MADEIN", "Supernova", 2026],
  ["Meow", "MEOVV", "MEOW", 2024],
  ["Body", "MEOVV", "MEOW", 2024],
  ["Toxic", "MEOVV", "TOXIC", 2024],
  ["Handz Up", "MEOVV", "HANDZ UP", 2025],
  ["Drop Top", "MEOVV", "Drop Top", 2025],
  ["Chasing Lightning", "MEOVV", "Chasing Lightning", 2026],
  ["Bada Boom", "MAMAMOO+", "ACT 1, SCENE 1", 2023],
  ["Chili", "MAMAMOO+", "ACT 1, SCENE 1", 2023],
  ["Dolla", "MAMAMOO+", "ACT 1, SCENE 1", 2023],
  ["GGBB", "MAMAMOO+", "ACT 1, SCENE 1", 2023],
  ["Two Ơ Two", "MAMAMOO+", "ACT 1, SCENE 1", 2023],
  ["Dang Dang", "MAMAMOO+", "TWO RABBITS", 2023],
  ["I Like This", "MAMAMOO+", "TWO RABBITS", 2023],
  ["Starry Night", "MAMAMOO+", "TWO RABBITS", 2023],
  ["Save Me", "MAMAMOO+", "TWO RABBITS", 2023],
  ["Chico malo", "MAMAMOO+", "TWO RABBITS", 2023],
  ["TWIT", "Solar", "SPIT IT OUT", 2019],
  ["Spit It Out", "Solar", "SPIT IT OUT", 2023],
  ["Honey", "Solar", "容 : FACE", 2022],
  ["RAW", "Solar", "容 : FACE", 2022],
  ["Chap Chap", "Solar", "容 : FACE", 2022],
  ["Big Booty", "Solar", "容 : FACE", 2022],
  ["AZRAEL", "Solar", "COLOURS", 2024],
  ["But I", "Solar", "COLOURS", 2024],
  ["WANT", "Solar", "WANT", 2025],
  ["Eclipse", "Moonbyul", "Dark Side of the Moon", 2020],
  ["Mirror", "Moonbyul", "Dark Side of the Moon", 2020],
  ["ILJIDO", "Moonbyul", "Dark Side of the Moon", 2020],
  ["MOON MOVIE", "Moonbyul", "Dark Side of the Moon", 2020],
  ["Selfish (feat. Seulgi)", "Moonbyul", "Selfish", 2018],
  ["Shutdown (feat. Seori)", "Moonbyul", "6equence", 2022],
  ["G999 (feat. Mirani)", "Moonbyul", "6equence", 2022],
  ["C.I.T.T (Cheese in the Trap)", "Moonbyul", "C.I.T.T", 2022],
  ["Think About", "Moonbyul", "C.I.T.T", 2022],
  ["TOUCHIN & MOVIN", "Moonbyul", "Starlit of Muse", 2024],
  ["Is This Love?", "Moonbyul", "Starlit of Twinkle", 2024],
  ["Easy (feat. Sik-K)", "Wheein", "EASY", 2018],
  ["Goodbye", "Wheein", "soar", 2019],
  ["Water Color", "Wheein", "Redd", 2021],
  ["Pastel", "Wheein", "Redd", 2021],
  ["OHAYO MY NIGHT", "Wheein", "Redd", 2021],
  ["Trash (feat. pH-1)", "Wheein", "Redd", 2021],
  ["Ooh La La", "Wheein", "Redd", 2021],
  ["Make Me Happy", "Wheein", "WHEE", 2022],
  ["Pink Cloud", "Wheein", "WHEE", 2022],
  ["Letter Filled With Light", "Wheein", "WHEE", 2022],
  ["Deserve (Interlude)", "Wheein", "WHEE", 2022],
  ["Deserve (Full Ver.)", "Wheein", "WHEE", 2022],
  ["Rainbow", "Wheein", "WHEE", 2022],
  ["Breeze", "Wheein", "WHEE", 2022],
  ["In the Mood", "Wheein", "IN the mood", 2023],
  ["Spark", "Wheein", "In the Mood", 2023],
  ["Twit", "Hwasa", "TWIT", 2019],
  ["Maria", "Hwasa", "María", 2020],
  ["Intro : Nobody else", "Hwasa", "María", 2020],
  ["Kidding", "Hwasa", "María", 2020],
  ["Why", "Hwasa", "María", 2020],
  ["I'm a B", "Hwasa", "Guilty Pleasure", 2021],
  ["FOMO", "Hwasa", "Guilty Pleasure", 2021],
  ["LMM", "Hwasa", "Guilty Pleasure", 2021],
  ["I Love My Body", "Hwasa", "I Love My Body", 2023],
  ["NA", "Hwasa", "O", 2024],
  ["Satellite", "Mashiro", "24/11", 2026],
  ["I Know", "MAMADOL", "The Return of Superman OST", 2022],
  ["WooAh HIP", "MAMADOL", "WooAh HIP", 2022],
  ["Spit It Out", "MAJORS", "The Beginning of Legend", 2021],
  ["Rain On Me", "MAJORS", "The Beginning of Legend – Rising Star", 2021],
  ["Dancing in the Starlit Night", "MAJORS", "The Beginning of Legend – Rising Star", 2021],
  ["Shining Star", "MAJORS", "The Beginning of Legend – Shining Star", 2021],
  ["Obvious", "MAJORS", "The Beginning of Legend – Shining Star", 2021],
  ["Vacation", "MAJORS", "The Beginning of Legend – Shining Star", 2021],
  ["Salute", "MAJORS", "THE END OF CHAOS", 2022],
  ["Giddy Up", "MAJORS", "THE END OF CHAOS", 2022],
  ["Storm", "MAP6", "Storm", 2015],
  ["Swagger Time", "MAP6", "Swagger Time", 2016],
  ["Force Joule", "MAP6", "Swagger Time", 2016],
  ["Magic", "MAP6", "Magic", 2016],
  ["Love Story", "MAP6", "Love Story", 2016],
  ["No Surrender", "MAP6", "Momentum", 2017],
  ["Mick Mac", "MAP6", "Momentum", 2017],
  ["I'm Ready", "MAP6", "Momentum", 2017],
  ["Shot Call", "LNGSHOT", "Shot Call", 2024],
  ["Aim High", "LNGSHOT", "Shot Call", 2024],
  ["Overdrive", "LNGSHOT", "Overdrive", 2024],
  ["Target", "LNGSHOT", "Target", 2025],
  ["Locked In", "LNGSHOT", "Locked In", 2025],
  ["Bullseye", "LNGSHOT", "Bullseye", 2026],
  ["Pit-A-Pat", "LABOUM", "PETIT MACARON", 2014],
  ["Dix-Dix", "LABOUM", "PETIT MACARON", 2014],
  ["Look At Me", "LABOUM", "PETIT MACARON", 2014],
  ["Sugar Sugar", "LABOUM", "Sugar Sugar", 2015],
  ["AALOW AALOW", "LABOUM", "AALOW AALOW", 2015],
  ["Tasty", "LABOUM", "AALOW AALOW", 2015],
  ["Night Like This", "LABOUM", "AALOW AALOW", 2015],
  ["Journey to Atlantis", "LABOUM", "Fresh Adventure", 2016],
  ["Strike Out", "LABOUM", "Fresh Adventure", 2016],
  ["Caterpillar", "LABOUM", "Fresh Adventure", 2016],
  ["Shooting Love", "LABOUM", "LOVE SIGN", 2016],
  ["Ding Dong", "LABOUM", "LOVE SIGN", 2016],
  ["Sweet Lie", "LABOUM", "LOVE SIGN", 2016],
  ["Like U Love U", "LABOUM", "LOVE SIGN", 2016],
  ["Winter Story", "LABOUM", "Winter Story", 2016],
  ["Hwi hwi", "LABOUM", "MISS THIS KISS", 2017],
  ["Story Snow", "LABOUM", "MISS THIS KISS", 2017],
  ["In Comparison", "LABOUM", "MISS THIS KISS", 2017],
  ["Only U", "LABOUM", "LABOUM Summer Special", 2017],
  ["Between Us", "LABOUM", "Between Us", 2018],
  ["Love Game", "LABOUM", "Between Us", 2018],
  ["Turn It On", "LABOUM", "I'M YOURS", 2018],
  ["Heal Song", "LABOUM", "I'M YOURS", 2018],
  ["Firework", "LABOUM", "Two Of Us", 2019],
  ["You're The Light", "LABOUM", "Two Of Us", 2019],
  ["Satellite", "LABOUM", "Two Of Us", 2019],
  ["Cheese", "LABOUM", "Cheese", 2020],
  ["Kiss Kiss", "LABOUM", "BLOSSOM", 2021],
  ["Love On You", "LABOUM", "BLOSSOM", 2021],
  ["Same Then", "LABOUM", "BLOSSOM", 2021],
  ["Repeat", "LABOUM", "BLOSSOM", 2021],
  ["Bad Girl", "LADIES' CODE", "CODE#01 Bad Girl", 2013],
  ["SuperGirl", "LADIES' CODE", "CODE#01 Bad Girl", 2013],
  ["Dada La", "LADIES' CODE", "CODE#01 Bad Girl", 2013],
  ["Won't Cry", "LADIES' CODE", "CODE#01 Bad Girl", 2013],
  ["Hate You", "LADIES' CODE", "CODE#02 Pretty Pretty", 2013],
  ["Pretty Pretty", "LADIES' CODE", "CODE#02 Pretty Pretty", 2013],
  ["I'm Fine Thank You", "LADIES' CODE", "CODE#02 Pretty Pretty", 2013],
  ["So Wonderful", "LADIES' CODE", "So Wonderful", 2014],
  ["Kiss Kiss", "LADIES' CODE", "Kiss Kiss", 2014],
  ["Galaxy", "LADIES' CODE", "MYST3RY", 2016],
  ["My Flower", "LADIES' CODE", "MYST3RY", 2016],
  ["Chaconne", "LADIES' CODE", "MYST3RY", 2016],
  ["The Rain", "LADIES' CODE", "STRANG3R", 2016],
  ["Lorelei", "LADIES' CODE", "STRANG3R", 2016],
  ["Jane", "LADIES' CODE", "STRANG3R", 2016],
  ["The Last Holiday", "LADIES' CODE", "THE LAST HOLIDAY", 2018],
  ["Feedback", "LADIES' CODE", "FEEDBACK", 2019],
  ["Set Me Free", "LADIES' CODE", "CODE#03 SET ME FREE", 2019],
  ["NEW DAY", "LADIES' CODE", "CODE#03 SET ME FREE", 2019],
  ["Never Ending Story", "LADIES' CODE", "CODE#03 SET ME FREE", 2019],
  ["Jasmine", "LADIES' CODE", "CODE#03 SET ME FREE", 2019],
  ["Hit Ya!", "Lapillus", "HIT YA!", 2022],
  ["GRATATA", "Lapillus", "GIRL's ROUND Part.1", 2022],
  ["Burn With Love", "Lapillus", "GIRL's ROUND Part.1", 2022],
  ["Queendom", "Lapillus", "GIRL's ROUND Part.1", 2022],
  ["Who's Next", "Lapillus", "GIRL's ROUND Part.2", 2023],
  ["Marionette", "Lapillus", "GIRL's ROUND Part.2", 2023],
  ["Paper", "Lapillus", "GIRL's ROUND Part.2", 2023],
  ["ULALA", "Lapillus", "ULALA", 2024],
  ["Daylight", "Lapillus", "ULALA", 2024],
  ["Sparks", "Lapillus", "Sparks", 2024],
  ["Chasing Stars", "Lapillus", "Chasing Stars", 2025],
  ["Vibe Check", "Lapillus", "Vibe Check", 2025],
  ["Vanilla", "LIGHTSUM", "Vanilla", 2021],
  ["Vivace", "LIGHTSUM", "Light a Wish", 2021],
  ["You, jam", "LIGHTSUM", "Light a Wish", 2021],
  ["Popcorn", "LIGHTSUM", "Light a Wish", 2021],
  ["ALIVE", "LIGHTSUM", "Into The Light", 2022],
  ["i", "LIGHTSUM", "Into The Light", 2022],
  ["GOOD NEWS", "LIGHTSUM", "Into The Light", 2022],
  ["Q", "LIGHTSUM", "Into The Light", 2022],
  ["Bye Bye Love", "LIGHTSUM", "Into The Light", 2022],
  ["Honey or Spice", "LIGHTSUM", "Honey or Spice", 2023],
  ["Not My Fault", "LIGHTSUM", "Honey or Spice", 2023],
  ["Candarlight", "LIGHTSUM", "Honey or Spice", 2023],
  ["Pose!", "LIGHTSUM", "Pose!", 2024],
  ["Cherry Drop", "LIGHTSUM", "Cherry Drop", 2025],
  ["Glow Up", "LIGHTSUM", "Glow Up", 2025],
  ["Electric Heart", "LIGHTSUM", "Electric Heart", 2026],
  ["Starlight", "LIMELIGHT", "LIMELIGHT", 2022],
  ["Eye To Eye", "LIMELIGHT", "LIMELIGHT", 2022],
  ["Paradise", "LIMELIGHT", "LIMELIGHT", 2022],
  ["Cha Cha", "LIMELIGHT", "LIMELIGHT", 2022],
  ["HONESTLY", "LIMELIGHT", "LOVE & HAPPINESS", 2023],
  ["Blanc Noir", "LIMELIGHT", "LOVE & HAPPINESS", 2023],
  ["Crystal", "LIMELIGHT", "LOVE & HAPPINESS", 2023],
  ["MADELEINE", "LIMELIGHT", "MADELEINE", 2023],
  ["TA-DA!", "LIMELIGHT", "LAST DANCE", 2024],
  ["Baby, Maybe Crazy", "LIMELIGHT", "LAST DANCE", 2024],
  ["IF U KNOW U KNOW", "LIMELIGHT", "LAST DANCE", 2024],
  ["TWINKLE TWINKLE", "LIMELIGHT", "LAST DANCE", 2024],
  ["Sensitive", "Loosemble", "Loossemble", 2023],
  ["Real World", "Loosemble", "Loossemble", 2023],
  ["Colouring", "Loosemble", "Loossemble", 2023],
  ["Newtopia", "Loosemble", "Loossemble", 2023],
  ["Strawberry Soda", "Loosemble", "Loossemble", 2023],
  ["Day by Day", "Loosemble", "Loossemble", 2023],
  ["Girls' Night", "Loosemble", "One of a Kind", 2024],
  ["Moonlight", "Loosemble", "One of a Kind", 2024],
  ["Boomerang", "Loosemble", "One of a Kind", 2024],
  ["He Said I Said", "Loosemble", "One of a Kind", 2024],
  ["Truman Show", "Loosemble", "One of a Kind", 2024],
  ["Starlight", "Loosemble", "One of a Kind", 2024],
  ["TTYL", "Loosemble", "TTYL", 2024],
  ["Cotton Candy", "Loosemble", "TTYL", 2024],
  ["Confessions", "Loosemble", "TTYL", 2024],
  ["Hocus Pocus", "Loosemble", "TTYL", 2024],
  ["Secret Diary", "Loosemble", "TTYL", 2024],
  ["Introducing The Candy", "Lovelyz", "Girls' Invasion", 2014],
  ["Candy Jelly Love", "Lovelyz", "Girls' Invasion", 2014],
  ["Good Night Like Yesterday", "Lovelyz", "Girls' Invasion", 2014],
  ["Chapter 1", "Lovelyz", "Girls' Invasion", 2014],
  ["Get Shunned", "Lovelyz", "Girls' Invasion", 2014],
  ["Delight", "Lovelyz", "Girls' Invasion", 2014],
  ["Hi~", "Lovelyz", "Hi~", 2015],
  ["Joyland", "Lovelyz", "Hi~", 2015],
  ["Ah-Choo", "Lovelyz", "Lovelyz8", 2015],
  ["Shooting Star", "Lovelyz", "Lovelyz8", 2015],
  ["How to Be a Pretty Girl", "Lovelyz", "Lovelyz8", 2015],
  ["Sweet and Sour", "Lovelyz", "Lovelyz8", 2015],
  ["Hug Me", "Lovelyz", "Lovelyz8", 2015],
  ["For You", "Lovelyz", "Lovelinus", 2015],
  ["Circle", "Lovelyz", "Lovelinus", 2015],
  ["Bebe", "Lovelyz", "Lovelinus", 2015],
  ["Destiny", "Lovelyz", "A New Trilogy", 2016],
  ["You", "Lovelyz", "A New Trilogy", 2016],
  ["1cm", "Lovelyz", "A New Trilogy", 2016],
  ["Doll", "Lovelyz", "A New Trilogy", 2016],
  ["Emotion", "Lovelyz", "A New Trilogy", 2016],
  ["WoW!", "Lovelyz", "RU Ready?", 2017],
  ["Cameo", "Lovelyz", "RU Ready?", 2017],
  ["Now, We", "Lovelyz", "Now, We", 2017],
  ["Aya", "Lovelyz", "Now, We", 2017],
  ["Twinkle", "Lovelyz", "Fall in Lovelyz", 2017],
  ["Just", "Lovelyz", "Fall in Lovelyz", 2017],
  ["FALLIN'", "Lovelyz", "Fall in Lovelyz", 2017],
  ["That Day", "Lovelyz", "Heal", 2018],
  ["Mi-myo Mi-myo", "Lovelyz", "Heal", 2018],
  ["Temptation", "Lovelyz", "Heal", 2018],
  ["Lost N Found", "Lovelyz", "SANCTUARY", 2018],
  ["Like U", "Lovelyz", "SANCTUARY", 2018],
  ["Rewind", "Lovelyz", "SANCTUARY", 2018],
  ["Beautiful Days", "Lovelyz", "Once Upon a Time", 2019],
  ["Close To You", "Lovelyz", "Once Upon a Time", 2019],
  ["Sweet Luv", "Lovelyz", "Once Upon a Time", 2019],
  ["Obliviate", "Lovelyz", "Unforgettable", 2020],
  ["Dream In A Dream", "Lovelyz", "Unforgettable", 2020],
  ["Never, Secret", "Lovelyz", "Unforgettable", 2020],
  ["Absolute Secret", "Lovelyz", "Unforgettable", 2020],
  ["November", "Lovelyz", "November", 2024],
  ["Wild Heart", "Lun8", "CONTINUUM", 2023],
  ["Voyager", "Lun8", "CONTINUUM", 2023],
  ["XX", "Lun8", "CONTINUUM", 2023],
  ["We Like It", "Lun8", "CONTINUUM", 2023],
  ["Live In The Moment", "Lun8", "BUFF", 2024],
  ["SUPER POWER", "Lun8", "BUFF", 2024],
  ["GOT THE BOOGIE", "Lun8", "BUFF", 2024],
  ["PASTEL", "Lun8", "BUFF", 2024],
  ["MONSTER", "Lun8", "AWAKENING", 2024],
  ["Ride with Me", "Lun8", "AWAKENING", 2024],
  ["Love Game", "Lun8", "AWAKENING", 2024],
  ["Night Drive", "Lun8", "Night Drive", 2025],
  ["Overdrive", "Lun8", "Overdrive", 2025],
  ["Signal", "Lun8", "Signal", 2026],
  ["Trespass", "Monsta X", "TRESPASS", 2015],
  ["No Exit", "Monsta X", "TRESPASS", 2015],
  ["One Love", "Monsta X", "TRESPASS", 2015],
  ["Honestly", "Monsta X", "TRESPASS", 2015],
  ["Steal Your Heart", "Monsta X", "TRESPASS", 2015],
  ["Rush", "Monsta X", "RUSH", 2015],
  ["Hero", "Monsta X", "RUSH", 2015],
  ["Perfect Girl", "Monsta X", "RUSH", 2015],
  ["Amen", "Monsta X", "RUSH", 2015],
  ["All In", "Monsta X", "THE CLAN Pt. 1 'LOST'", 2016],
  ["Ex Girl (feat. Wheein)", "Monsta X", "THE CLAN Pt. 1 'LOST'", 2016],
  ["Focus on Me", "Monsta X", "THE CLAN Pt. 1 'LOST'", 2016],
  ["Unfair Love", "Monsta X", "THE CLAN Pt. 1 'LOST'", 2016],
  ["Because of U", "Monsta X", "THE CLAN Pt. 1 'LOST'", 2016],
  ["Fighter", "Monsta X", "THE CLAN Pt. 2 'GUILTY'", 2016],
  ["Be Quiet", "Monsta X", "THE CLAN Pt. 2 'GUILTY'", 2016],
  ["Blind", "Monsta X", "THE CLAN Pt. 2 'GUILTY'", 2016],
  ["Queen", "Monsta X", "THE CLAN Pt. 2 'GUILTY'", 2016],
  ["White Sugar", "Monsta X", "THE CLAN Pt. 2 'GUILTY'", 2016],
  ["Beautiful", "Monsta X", "THE CLAN Pt. 2.5 'BEAUTIFUL'", 2017],
  ["Ready or Not", "Monsta X", "THE CLAN Pt. 2.5 'BEAUTIFUL'", 2017],
  ["Incomparable", "Monsta X", "THE CLAN Pt. 2.5 'BEAUTIFUL'", 2017],
  ["Need U", "Monsta X", "THE CLAN Pt. 2.5 'BEAUTIFUL'", 2017],
  ["Oi", "Monsta X", "THE CLAN Pt. 2.5 'BEAUTIFUL'", 2017],
  ["Shine Forever", "Monsta X", "SHINE FOREVER", 2017],
  ["Gravity", "Monsta X", "SHINE FOREVER", 2017],
  ["Dramarama", "Monsta X", "THE CODE", 2017],
  ["Now or Never", "Monsta X", "THE CODE", 2017],
  ["From Zero", "Monsta X", "THE CODE", 2017],
  ["X", "Monsta X", "THE CODE", 2017],
  ["In Time", "Monsta X", "THE CODE", 2017],
  ["Jealousy", "Monsta X", "THE CONNECT : DEJAVU", 2018],
  ["Destroyer", "Monsta X", "THE CONNECT : DEJAVU", 2018],
  ["Fallin'", "Monsta X", "THE CONNECT : DEJAVU", 2018],
  ["Crazy in Love", "Monsta X", "THE CONNECT : DEJAVU", 2018],
  ["Shoot Out", "Monsta X", "TAKE.1 ARE YOU THERE?", 2018],
  ["Underwater", "Monsta X", "TAKE.1 ARE YOU THERE?", 2018],
  ["Heart Attack", "Monsta X", "TAKE.1 ARE YOU THERE?", 2018],
  ["Alligator", "Monsta X", "TAKE.2 WE ARE HERE", 2019],
  ["Ghost", "Monsta X", "TAKE.2 WE ARE HERE", 2019],
  ["No Reason", "Monsta X", "TAKE.2 WE ARE HERE", 2019],
  ["Love Killa", "Monsta X", "FATAL LOVE", 2020],
  ["Gasoline", "Monsta X", "FATAL LOVE", 2020],
  ["Night View", "Monsta X", "FATAL LOVE", 2020],
  ["Gambler", "Monsta X", "ONE OF A KIND", 2021],
  ["Heaven", "Monsta X", "ONE OF A KIND", 2021],
  ["Secrets", "Monsta X", "ONE OF A KIND", 2021],
  ["Rush Hour", "Monsta X", "NO LIMIT", 2021],
  ["Autobahn", "Monsta X", "NO LIMIT", 2021],
  ["Ride with U", "Monsta X", "NO LIMIT", 2021],
  ["LOVE", "Monsta X", "SHAPE of LOVE", 2022],
  ["And", "Monsta X", "SHAPE of LOVE", 2022],
  ["Wildfire", "Monsta X", "SHAPE of LOVE", 2022],
  ["Beautiful Liar", "Monsta X", "REASON", 2023],
  ["Crescendo", "Monsta X", "REASON", 2023],
  ["LONE RANGER", "Monsta X", "REASON", 2023],
  ["Denial", "Monsta X", "REASON", 2023],
  ["Over The Top", "Monsta X", "NOW OR NEVER", 2025],
  ["Unstoppable", "Monsta X", "NOW OR NEVER", 2025],
  ["Love Me A Little", "Shownu X Hyungwon", "THE UNSEEN", 2023],
  ["Love Therapy", "Shownu X Hyungwon", "THE UNSEEN", 2023],
  ["Roll With Me", "Shownu X Hyungwon", "THE UNSEEN", 2023],
  ["Play Me", "Shownu X Hyungwon", "THE UNSEEN", 2023],
  ["Slow Motion", "Shownu X Hyungwon", "THE UNSEEN", 2023],
  ["God Damn", "I.M", "DUALITY", 2021],
  ["Howlin'", "I.M", "DUALITY", 2021],
  ["Happy to Die", "I.M", "DUALITY", 2021],
  ["Deadlight", "I.M", "DUALITY", 2021],
  ["flower-ed", "I.M", "DUALITY", 2021],
  ["OVERDRIVE", "I.M", "OVERDRIVE", 2023],
  ["Blame", "I.M", "OVERDRIVE", 2023],
  ["Dumb", "I.M", "OVERDRIVE", 2023],
  ["Habit", "I.M", "OVERDRIVE", 2023],
  ["More", "I.M", "OVERDRIVE", 2023],
  ["Not Sorry", "I.M", "OVERDRIVE", 2023],
  ["LURE", "I.M", "Off The Beat", 2024],
  ["Bust It", "I.M", "Off The Beat", 2024],
  ["X0", "I.M", "Off The Beat", 2024],
  ["Skyline", "I.M", "Off The Beat", 2024],
  ["MMI", "I.M", "Off The Beat", 2024],
  ["NBP", "I.M", "Off The Beat", 2024],
  ["FREEDOM", "Joohoney", "LIGHTS", 2023],
  ["HYPE ENERGY", "Joohoney", "LIGHTS", 2023],
  ["Voice", "Joohoney", "LIGHTS", 2023],
  ["Evolution", "Joohoney", "LIGHTS", 2023],
  ["STORY OF US", "Joohoney", "LIGHTS", 2023],
  ["Don't Worry, Be Happy", "Joohoney", "LIGHTS", 2023],
  ["JJan! Koong! Kwang!", "Momoland", "Welcome to MOMOLAND", 2016],
  ["Welcome to MOMOLAND", "Momoland", "Welcome to MOMOLAND", 2016],
  ["Love Sick", "Momoland", "Welcome to MOMOLAND", 2016],
  ["uh-gi-yeo-cha", "Momoland", "Welcome to MOMOLAND", 2016],
  ["Wonderful Love", "Momoland", "Wonderful Love", 2017],
  ["Freeze", "Momoland", "Freeze!", 2017],
  ["I Like It", "Momoland", "Freeze!", 2017],
  ["What Planet Are You From?", "Momoland", "Freeze!", 2017],
  ["Orgel", "Momoland", "Freeze!", 2017],
  ["BBoom BBoom", "Momoland", "GREAT!", 2018],
  ["Curious", "Momoland", "GREAT!", 2018],
  ["Same Same", "Momoland", "GREAT!", 2018],
  ["Fly", "Momoland", "GREAT!", 2018],
  ["BAAM", "Momoland", "Fun to The World", 2018],
  ["VeryVery", "Momoland", "Fun to The World", 2018],
  ["Bing Bang Boom", "Momoland", "Fun to The World", 2018],
  ["Only One You", "Momoland", "Fun to The World", 2018],
  ["I'm So Hot", "Momoland", "ShowMe", 2019],
  ["Falling U", "Momoland", "ShowMe", 2019],
  ["Light Up", "Momoland", "ShowMe", 2019],
  ["Holiday", "Momoland", "ShowMe", 2019],
  ["What You Want", "Momoland", "ShowMe", 2019],
  ["Thumbs Up", "Momoland", "Thumbs Up", 2019],
  ["Starry Night", "Momoland", "Starry Night", 2020],
  ["Pinky Love", "Momoland", "Starry Night", 2020],
  ["Chiri Chiri", "Momoland", "Starry Night", 2020],
  ["Ready Or Not", "Momoland", "Ready Or Not", 2020],
  ["Merry Go Round", "Momoland", "Ready Or Not", 2020],
  ["Yummy Yummy Love (with Natti Natasha)", "Momoland", "Yummy Yummy Love", 2022],
  ["YOLO", "MADTOWN", "Mad Town", 2014],
  ["What's Your Number?", "MADTOWN", "Mad Town", 2014],
  ["Stunning", "MADTOWN", "Mad Town", 2014],
  ["New World", "MADTOWN", "Welcome to MADTOWN", 2015],
  ["Thinking of You", "MADTOWN", "Welcome to MADTOWN", 2015],
  ["I'm Serious", "MADTOWN", "Welcome to MADTOWN", 2015],
  ["OMGT", "MADTOWN", "OMGT", 2015],
  ["Emptiness", "MADTOWN", "Emotion", 2016],
  ["Yah!", "MADTOWN", "Emotion", 2016],
  ["Get Out", "MADTOWN", "Emotion", 2016],
  ["Lie", "MADTOWN", "Emotion", 2016],
  ["MIRAI", "ME:I", "MIRAI", 2024],
  ["Click", "ME:I", "MIRAI", 2024],
  ["Sugar Bomb", "ME:I", "MIRAI", 2024],
  ["Fly Up High", "ME:I", "MIRAI", 2024],
  ["Hi-Five", "ME:I", "Hi-Five", 2024],
  ["Cookie Party", "ME:I", "Hi-Five", 2024],
  ["Our Diary", "ME:I", "Hi-Five", 2024],
  ["Sweetie", "ME:I", "Sweetie", 2024],
  ["Next Level", "ME:I", "Sweetie", 2024],
  ["Bloom", "ME:I", "Bloom", 2025],
  ["Sparkle", "ME:I", "Bloom", 2025],
  ["Vivid", "ME:I", "Vivid", 2025],
  ["Daydream", "ME:I", "Vivid", 2025],
  ["Shine On", "ME:I", "Shine On", 2026],
  ["KILLA", "MIRAE", "KILLA", 2021],
  ["Higher", "MIRAE", "KILLA", 2021],
  ["Swagger", "MIRAE", "KILLA", 2021],
  ["Sweet Dreams", "MIRAE", "KILLA", 2021],
  ["1u2u", "MIRAE", "KILLA", 2021],
  ["Splash", "MIRAE", "Splash", 2021],
  ["Bang-Up", "MIRAE", "Splash", 2021],
  ["New Days", "MIRAE", "Splash", 2021],
  ["Don't Stop", "MIRAE", "Marvelous", 2022],
  ["Marvelous", "MIRAE", "Marvelous", 2022],
  ["JUICE", "MIRAE", "Marvelous", 2022],
  ["Drip N' Drop", "MIRAE", "Ourturn", 2022],
  ["Welcome to the Future", "MIRAE", "Ourturn", 2022],
  ["Daydreamin'", "MIRAE", "Ourturn", 2022],
  ["JUMP!", "MIRAE", "Boys will be Boys", 2023],
  ["GIRL", "MIRAE", "Boys will be Boys", 2023],
  ["So Different", "MIRAE", "Boys will be Boys", 2023],
  ["RUNNING UP", "MIRAE", "RUNNING UP", 2024],
  ["Rose", "MIMIIROSE", "AWESOME", 2022],
  ["Lululu", "MIMIIROSE", "AWESOME", 2022],
  ["Kill Me More", "MIMIIROSE", "AWESOME", 2022],
  ["Flirting", "MIMIIROSE", "LIVE", 2023],
  ["A-OK", "MIMIIROSE", "LIVE", 2023],
  ["The CEO", "MIMIIROSE", "REEBORN", 2024],
  ["Ribbon", "MIMIIROSE", "REEBORN", 2024],
  ["DELUSION", "MIMIIROSE", "DELUSION", 2025],
  ["Attitude", "MIMIIROSE", "Attitude", 2025],
  ["Odyssey", "MODYSSEY", "MODYSSEY", 2024],
  ["Voyage", "MODYSSEY", "MODYSSEY", 2024],
  ["Signal Line", "MODYSSEY", "MODYSSEY", 2024],
  ["Starlight", "MODYSSEY", "Starlight", 2025],
  ["Eclipse", "MODYSSEY", "Eclipse", 2025],
  ["Intro (Big Bang)", "BIGBANG", "First Single Album", 2006],
  ["She Can't Get Enough", "BIGBANG", "First Single Album", 2006],
  ["Dirty Cash", "BIGBANG", "First Single Album", 2006],
  ["Next Day", "BIGBANG", "First Single Album", 2006],
  ["Big Boy", "BIGBANG", "First Single Album", 2006],
  ["Shake It", "BIGBANG", "BigBangisV.I.P", 2006],
  ["A Fool Of Tears", "BIGBANG", "BigBangisV.I.P", 2006],
  ["My Girl", "BIGBANG", "BigBangisV.I.P", 2006],
  ["La La La", "BIGBANG", "BigBang03", 2006],
  ["This Love", "BIGBANG", "BigBang03", 2006],
  ["Laugh It Off", "BIGBANG", "BigBang03", 2006],
  ["Intro (Put Your Hands Up)", "BIGBANG", "Since 2007", 2006],
  ["Cream", "BIGBANG", "Since 2007", 2006],
  ["Lies", "BIGBANG", "Always", 2007],
  ["Always", "BIGBANG", "Always", 2007],
  ["Sunset Glow", "BIGBANG", "Remember", 2008],
  ["Haru Haru", "BIGBANG", "Stand Up", 2008],
  ["Heaven", "BIGBANG", "Stand Up", 2008],
  ["Fantastic Baby", "BIGBANG", "Alive", 2012],
  ["Blue", "BIGBANG", "Alive", 2012],
  ["Bad Boy", "BIGBANG", "Alive", 2012],
  ["Monster", "BIGBANG", "Still Alive", 2012],
  ["Loser", "BIGBANG", "M", 2015],
  ["Bae Bae", "BIGBANG", "M", 2015],
  ["Bang Bang Bang", "BIGBANG", "A", 2015],
  ["We Like 2 Party", "BIGBANG", "A", 2015],
  ["If You", "BIGBANG", "D", 2015],
  ["Sober", "BIGBANG", "D", 2015],
  ["Let's Not Fall In Love", "BIGBANG", "E", 2015],
  ["Zutter", "BIGBANG", "E", 2015],
  ["Fxxk It", "BIGBANG", "Made", 2016],
  ["Last Dance", "BIGBANG", "Made", 2016],
  ["Girlfriend", "BIGBANG", "Made", 2016],
  ["Still Life", "BIGBANG", "Still Life", 2022],
  ["The 7th Sense", "NCT", "The 7th Sense", 2016],
  ["WITHOUT YOU", "NCT", "WITHOUT YOU", 2016],
  ["Black on Black", "NCT", "NCT 2018 EMPATHY", 2018],
  ["Make A Wish (Birthday Song)", "NCT", "NCT RESONANCE Pt. 1", 2020],
  ["From Home", "NCT", "NCT RESONANCE Pt. 1", 2020],
  ["90's Love", "NCT", "NCT RESONANCE Pt. 2", 2020],
  ["Work It", "NCT", "NCT RESONANCE Pt. 2", 2020],
  ["RESONANCE", "NCT", "RESONANCE", 2020],
  ["Universe (Let's Play Ball)", "NCT", "Universe", 2021],
  ["Beautiful", "NCT", "Universe", 2021],
  ["Golden Age", "NCT", "Golden Age", 2023],
  ["Baggy Jeans", "NCT", "Golden Age", 2023],
  ["Chewing Gum", "NCT DREAM", "Chewing Gum", 2016],
  ["My First and Last", "NCT DREAM", "The First", 2017],
  ["Dunk Shot", "NCT DREAM", "The First", 2017],
  ["We Young", "NCT DREAM", "We Young", 2017],
  ["La La Love", "NCT DREAM", "We Young", 2017],
  ["GO", "NCT DREAM", "NCT 2018 EMPATHY", 2018],
  ["We Go Up", "NCT DREAM", "We Go Up", 2018],
  ["1, 2, 3", "NCT DREAM", "We Go Up", 2018],
  ["BOOM", "NCT DREAM", "We Boom", 2019],
  ["STRONGER", "NCT DREAM", "We Boom", 2019],
  ["Ridin'", "NCT DREAM", "Reload", 2020],
  ["Quiet Down", "NCT DREAM", "Reload", 2020],
  ["Hot Sauce", "NCT DREAM", "Hot Sauce", 2021],
  ["Dive Into You", "NCT DREAM", "Hot Sauce", 2021],
  ["Hello Future", "NCT DREAM", "Hello Future", 2021],
  ["Glitch Mode", "NCT DREAM", "Glitch Mode", 2022],
  ["Arcade", "NCT DREAM", "Glitch Mode", 2022],
  ["Beatbox", "NCT DREAM", "Beatbox", 2022],
  ["Candy", "NCT DREAM", "Candy", 2022],
  ["Graduation", "NCT DREAM", "Candy", 2022],
  ["Broken Melodies", "NCT DREAM", "ISTJ", 2023],
  ["ISTJ", "NCT DREAM", "ISTJ", 2023],
  ["Yogurt Shake", "NCT DREAM", "ISTJ", 2023],
  ["Smoothie", "NCT DREAM", "DREAM( )SCAPE", 2024],
  ["BOX", "NCT DREAM", "DREAM( )SCAPE", 2024],
  ["Rains in Heaven", "NCT DREAM", "Rains in Heaven", 2024],
  ["When I'm With You", "NCT DREAM", "DREAMSCAPE", 2024],
  ["Flying Kiss", "NCT DREAM", "DREAMSCAPE", 2024],
  ["Child", "Mark", "NCT LAB", 2022],
  ["Golden Hour", "Mark", "NCT LAB", 2023],
  ["200", "Mark", "200", 2024],
  ["Good Person", "Haechan", "Plyリスト OST", 2022],
  ["Free Love", "Renjun & Chenle", "NCT LAB", 2023],
  ["Fire Truck", "NCT 127", "NCT #127", 2016],
  ["Once Again", "NCT 127", "NCT #127", 2016],
  ["Limitless", "NCT 127", "Limitless", 2017],
  ["Good Thing", "NCT 127", "Limitless", 2017],
  ["Cherry Bomb", "NCT 127", "Cherry Bomb", 2017],
  ["0 Mile", "NCT 127", "Cherry Bomb", 2017],
  ["Touch", "NCT 127", "NCT 2018 EMPATHY", 2018],
  ["Regular", "NCT 127", "Regular-Irregular", 2018],
  ["Simon Says", "NCT 127", "Regulate", 2018],
  ["Superhuman", "NCT 127", "WE ARE SUPERHUMAN", 2019],
  ["Highway to Heaven", "NCT 127", "WE ARE SUPERHUMAN", 2019],
  ["Kick It", "NCT 127", "Neo Zone", 2020],
  ["Punch", "NCT 127", "Neo Zone: The Final Round", 2020],
  ["Sticker", "NCT 127", "Sticker", 2021],
  ["Favorite (Vampire)", "NCT 127", "Favorite", 2021],
  ["2 Baddies", "NCT 127", "2 Baddies", 2022],
  ["Ay-Yo", "NCT 127", "Ay-Yo", 2023],
  ["Fact Check", "NCT 127", "Fact Check", 2023],
  ["Be There For Me", "NCT 127", "Be There For Me", 2023],
  ["Walk", "NCT 127", "WALK", 2024],
  ["Meaning of Love", "NCT 127", "WALK", 2024],
  ["Perfume", "NCT DoJaeJung", "Perfume", 2023],
  ["Kiss", "NCT DoJaeJung", "Perfume", 2023],
  ["Strawberry Sunday", "NCT DoJaeJung", "Perfume", 2023],
  ["SHALALA", "Taeyong", "SHALALA", 2023],
  ["TAP", "Taeyong", "TAP", 2024],
  ["Little Light", "Doyoung", "YOUTH", 2024],
  ["Beginning", "Doyoung", "YOUTH", 2024],
  ["Unconditional", "Jaehyun", "Unconditional", 2024],
  ["Smoke", "Jaehyun", "J", 2024],
  ["Off The Mask", "Yuta", "Depth", 2024],
  ["WISH", "NCT Wish", "WISH", 2024],
  ["Sail Away", "NCT Wish", "WISH", 2024],
  ["Songbird", "NCT Wish", "Songbird", 2024],
  ["Tears Are Falling", "NCT Wish", "Songbird", 2024],
  ["Dunk Shot", "NCT Wish", "Steady", 2024],
  ["Steady", "NCT Wish", "Steady", 2024],
  ["3 Minutes", "NCT Wish", "Steady", 2024],
  ["Regular", "WayV", "The Vision", 2018],
  ["Take Off", "WayV", "Take Off", 2019],
  ["Say It", "WayV", "Take Off", 2019],
  ["Let Me Love You", "WayV", "Take Off", 2019],
  ["Moonwalk", "WayV", "Take Over The Moon", 2019],
  ["Yeah Yeah Yeah", "WayV", "Take Over The Moon", 2019],
  ["Love Talk", "WayV", "Take Over The Moon", 2019],
  ["King of Hearts", "WayV", "Take Over The Moon", 2019],
  ["Turn Back Time", "WayV", "Awaken The World", 2020],
  ["Bad Alive", "WayV", "Awaken The World", 2020],
  ["Kick Back", "WayV", "Kick Back", 2021],
  ["Action Figure", "WayV", "Kick Back", 2021],
  ["Phantom", "WayV", "Phantom", 2022],
  ["Diamonds Only", "WayV", "Phantom", 2022],
  ["Give Me That", "WayV", "Give Me That", 2024],
  ["FREQUENCY", "WayV", "FREQUENCY", 2024],
  ["STARDUST", "WayV", "STARDUST", 2025],
  ["NEVERMIND", "WayV", "NEVERMIND", 2026],
  ["Back To You", "Kun & Xiaojun", "Back To You", 2021],
  ["TEN", "Ten", "TEN", 2024],
  ["Nightwalker", "Ten", "TEN", 2024],
  ["Fanfare", "SF9", "Feeling Sensation", 2016],
  ["K.O.", "SF9", "Feeling Sensation", 2016],
  ["ROAR", "SF9", "Burning Sensation", 2017],
  ["Easy Love", "SF9", "Breaking Sensation", 2017],
  ["O Sole Mio", "SF9", "Knights of the Sun", 2017],
  ["MAMMA MIA", "SF9", "MAMMA MIA!", 2018],
  ["Now or Never", "SF9", "SENSUOUS", 2018],
  ["Enough", "SF9", "NARCISSUS", 2019],
  ["RPM", "SF9", "RPM", 2019],
  ["Good Guy", "SF9", "FIRST COLLECTION", 2020],
  ["Summer Breeze", "SF9", "9loryUS", 2020],
  ["Tear Drop", "SF9", "TURN OVER", 2021],
  ["Trauma", "SF9", "RUMINATION", 2021],
  ["SCREAM", "SF9", "THE WAVE OF9", 2022],
  ["Puzzle", "SF9", "THE PIECE OF9", 2023],
  ["BIBORA", "SF9", "Sequence", 2024],
  ["Don't Worry, Be Happy", "SF9", "FANTASY", 2024],
  ["It's My Paradise", "Zuho", "Sequence", 2024],
  ["Starlight", "Chani", "True Beauty OST", 2021],
  ["Adore U", "Seventeen", "17 CARAT", 2015],
  ["Mansae", "Seventeen", "BOYS BE", 2015],
  ["Pretty U", "Seventeen", "FIRST 'LOVE & LETTER'", 2016],
  ["VERY NICE", "Seventeen", "Love & Letter Repackage Album", 2016],
  ["BOOMBOOM", "Seventeen", "Going Seventeen", 2016],
  ["Don't Wanna Cry", "Seventeen", "Al1", 2017],
  ["CLAP", "Seventeen", "TEEN, AGE", 2017],
  ["Thanks", "Seventeen", "DIRECTOR'S CUT", 2018],
  ["Call Call Call!", "Seventeen", "WE MAKE YOU", 2018],
  ["Oh My!", "Seventeen", "YOU MAKE MY DAY", 2018],
  ["Home", "Seventeen", "YOU MADE MY DAWN", 2019],
  ["Happy Ending", "Seventeen", "Happy Ending", 2019],
  ["HIT", "Seventeen", "HIT", 2019],
  ["Fear", "Seventeen", "An Ode", 2019],
  ["Fallin' Flower", "Seventeen", "Fallin' Flower", 2020],
  ["Left & Right", "Seventeen", "Heng:garæ", 2020],
  ["24H", "Seventeen", "24H", 2020],
  ["HOME;RUN", "Seventeen", "Semicolon", 2020],
  ["Not Alone", "Seventeen", "Not Alone", 2021],
  ["Ready to love", "Seventeen", "Your Choice", 2021],
  ["Rock with you", "Seventeen", "Attacca", 2021],
  ["Power of Love", "Seventeen", "Power of Love", 2021],
  ["HOT", "Seventeen", "Face the Sun", 2022],
  ["_WORLD", "Seventeen", "SECTOR 17", 2022],
  ["DREAM", "Seventeen", "DREAM", 2022],
  ["FML", "Seventeen", "FML", 2023],
  ["Ima -Even if the world ends tomorrow-", "Seventeen", "ALWAYS YOURS", 2023],
  ["God of Music", "Seventeen", "SEVENTEENTH HEAVEN", 2023],
  ["MAESTRO", "Seventeen", "17 IS RIGHT HERE", 2024],
  ["LOVE, MONEY, FAME (feat. DJ Khaled)", "Seventeen", "SPILL THE FEELS", 2024],
  ["THUNDER", "Seventeen", "HAPPY BURSTDAY", 2025],
  ["Last night", "JxW", "THIS MAN", 2024],
  ["Orbit", "V8", "V8", 2026],
  ["Spider", "Hoshi", "Spider", 2021],
  ["Ruby", "Woozi", "Ruby", 2022],
  ["Side By Side", "The8", "Side By Side", 2021],
  ["LIMBO", "Jun", "LIMBO", 2022],
  ["Black Eye", "Vernon", "Black Eye", 2022],
  ["Wait", "Dino", "Wait", 2023],
  ["I'm Your Girl", "S.E.S.", "I'm Your Girl", 1997],
  ["Dreams Come True", "S.E.S.", "Sea & Eugene & Shoo", 1998],
  ["Love", "S.E.S.", "Love", 1999],
  ["A Letter from Greenland", "S.E.S.", "A Letter from Greenland", 2000],
  ["Just In Love", "S.E.S.", "Surprise", 2001],
  ["U", "S.E.S.", "Choose My Life-U", 2002],
  ["S.II.S", "S.E.S.", "Friend", 2002],
  ["Remember", "S.E.S.", "Remember", 2017],
  ["Music", "Bada", "A Day of Renew", 2003],
  ["Aurora", "Bada", "Aurora", 2004],
  ["The Best", "Eugene", "My True Style...", 2003],
  ["Resolver", "Shinhwa", "Resolver", 1998],
  ["T.O.P.", "Shinhwa", "T.O.P.", 1999],
  ["Only One", "Shinhwa", "Only One", 2000],
  ["Hey, Come On!", "Shinhwa", "Hey, Come On!", 2001],
  ["Perfect Man", "Shinhwa", "Perfect Man", 2002],
  ["Wedding", "Shinhwa", "Wedding", 2002],
  ["Brand New", "Shinhwa", "Brand New", 2004],
  ["Once in a Lifetime", "Shinhwa", "State of the Art", 2006],
  ["Run", "Shinhwa", "Volume 9", 2008],
  ["Venus", "Shinhwa", "THE RETURN", 2012],
  ["This Love", "Shinhwa", "THE CLASSIC", 2013],
  ["Sniper", "Shinhwa", "WE", 2015],
  ["TOUCH", "Shinhwa", "UNCHANGING - TOUCH", 2017],
  ["Kiss Me Like That", "Shinhwa", "HEART", 2018],
  ["Just One Night", "Lee Min Woo", "Un-Touch-Able", 2003],
  ["Same Thought", "Shin Hye Sung", "Love of May", 2005],
  ["Wa", "Jun Jin", "Fascination", 2008],
  ["Love Song", "Andy", "Andy the First", 2007],
  ["Handcloth", "Kim Dong Wan", "Kimdongwan Is", 2007],
  ["Twins", "Super Junior", "SuperTwinz", 2005],
  ["U", "Super Junior", "U", 2006],
  ["Don't Don", "Super Junior", "Don't Don", 2007],
  ["Sorry, Sorry", "Super Junior", "Sorry, Sorry", 2009],
  ["Bonamana", "Super Junior", "Bonamana", 2010],
  ["Mr. Simple", "Super Junior", "Mr. Simple", 2011],
  ["Sexy, Free & Single", "Super Junior", "Sexy, Free & Single", 2012],
  ["SPY", "Super Junior", "SPY", 2012],
  ["MAMACITA", "Super Junior", "MAMACITA", 2014],
  ["This Is Love", "Super Junior", "This Is Love", 2014],
  ["Devil", "Super Junior", "Devil", 2015],
  ["Black Suit", "Super Junior", "PLAY", 2017],
  ["One More Time", "Super Junior", "One More Time", 2018],
  ["SUPER Clap", "Super Junior", "Time_Slip", 2019],
  ["House Party", "Super Junior", "The Renaissance", 2021],
  ["Callin'", "Super Junior", "The Road : Winter for Spring", 2022],
  ["Show Time", "Super Junior", "Show Time", 2024],
  ["At Gwanghwamun", "Kyuhyun", "At Gwanghwamun", 2014],
  ["The Little Prince", "Ryeowook", "The Little Prince", 2016],
  ["Here I am", "Yesung", "Here I am", 2016],
  ["Trap", "Henry", "Trap", 2013],
  ["Rewind", "Zhoumi", "Rewind", 2014],
  ["Orgel", "Sungmin", "Orgel", 2019],
  ["Jopping", "SuperM", "SuperM", 2019],
  ["100", "SuperM", "Super One", 2020],
  ["Lies", "T-ARA", "Lies", 2009],
  ["TTL", "T-ARA", "TTL (Time To Love)", 2009],
  ["Bo Peep Bo Peep", "T-ARA", "Absolute First Album", 2009],
  ["I Go Crazy Because of You", "T-ARA", "Breaking Heart", 2010],
  ["We Are the One", "T-ARA", "We Are the One", 2010],
  ["Yayaya", "T-ARA", "Temptastic", 2010],
  ["Roly-Poly", "T-ARA", "John Richard", 2011],
  ["Cry Cry", "T-ARA", "Black Eyes", 2011],
  ["Lovey-Dovey", "T-ARA", "Funky Town", 2012],
  ["Keep Out", "T-ARA", "Jewelry Box", 2012],
  ["DAY BY DAY", "T-ARA", "DAY BY DAY", 2012],
  ["SEXY LOVE", "T-ARA", "MIRAGE", 2012],
  ["Bunny Style!", "T-ARA", "Bunny Style!", 2013],
  ["TARGET", "T-ARA", "TARGET", 2013],
  ["Number Nine", "T-ARA", "AGAIN", 2013],
  ["Sugar Free", "T-ARA", "And&End", 2014],
  ["TIAMO", "T-ARA", "REMEMBER", 2016],
  ["What's My Name?", "T-ARA", "What's My Name?", 2017],
  ["ALL KILL", "T-ARA", "Re:T-ARA", 2021],
  ["Never Ever", "Jiyeon", "Never Ever", 2014],
  ["One Day", "Jiyeon", "One Day", 2018],
  ["Make Up", "Hyomin", "Make Up", 2014],
  ["Sketch", "Hyomin", "Sketch", 2016],
  ["Mango", "Hyomin", "Mango", 2018],
  ["I'm Good", "Eunjung", "I'm Good", 2015],
  ["Push Push", "SISTAR", "Push Push", 2010],
  ["Shady Girl", "SISTAR", "Shady Girl", 2010],
  ["How Dare You", "SISTAR", "How Dare You", 2010],
  ["So Cool", "SISTAR", "So Cool", 2011],
  ["Alone", "SISTAR", "Alone", 2012],
  ["Loving U", "SISTAR", "Loving U", 2012],
  ["Give It to Me", "SISTAR", "Give It to Me", 2013],
  ["Touch My Body", "SISTAR", "TOUCH N MOVE", 2014],
  ["I Swear", "SISTAR", "SWEET & SOUR", 2014],
  ["Shake It", "SISTAR", "SHAKE IT", 2015],
  ["I Like That", "SISTAR", "INSANE LOVE", 2016],
  ["Lonely", "SISTAR", "LONELY", 2017],
  ["Ma Boy", "SISTAR19", "Ma Boy", 2011],
  ["Gone Not Around Any Longer", "SISTAR19", "Gone Not Around Any Longer", 2013],
  ["One Way Love", "Hyolyn", "LOVE & HATE", 2013],
  ["Paradise", "Hyolyn", "IT'S ME", 2016],
  ["SAY MY NAME", "Hyolyn", "SAY MY NAME", 2020],
  ["Some", "Soyou", "Some", 2014],
  ["Gotta Go", "Soyou", "Gotta Go", 2020],
  ["Summer or Summer", "Dasom", "Summer or Summer", 2021],
  ["Super Hero", "VIXX", "Super Hero", 2012],
  ["Rock Ur Body", "VIXX", "Rock Ur Body", 2012],
  ["On and On", "VIXX", "On and On", 2013],
  ["Hyde", "VIXX", "Hyde", 2013],
  ["G.R.8.U", "VIXX", "Jekyll", 2013],
  ["Voodoo Doll", "VIXX", "Voodoo", 2013],
  ["Eternity", "VIXX", "Eternity", 2014],
  ["Error", "VIXX", "Error", 2014],
  ["Love Equation", "VIXX", "Boys' Record", 2015],
  ["Chained Up", "VIXX", "Chained Up", 2015],
  ["Fantasy", "VIXX", "Conception Ker", 2016],
  ["The Closer", "VIXX", "Kratos", 2016],
  ["Shangri-La", "VIXX", "Shangri-La", 2017],
  ["Scentist", "VIXX", "EAU DE VIXX", 2018],
  ["Walking", "VIXX", "Walking", 2019],
  ["GALE", "VIXX", "CHIC ANDY", 2023],
  ["Beautiful Liar", "VIXX LR", "Beautiful Liar", 2015],
  ["Whisper", "VIXX LR", "Whisper", 2017],
  ["Touch & Sketch", "Leo", "CANVAS", 2018],
  ["Just for a Moment", "Ken", "Greeting", 2020],
  ["Nirvana", "Ravi", "Nirvana", 2018],
  ["Gorilla", "Pentagon", "PENTAGON", 2016],
  ["Can You Feel It", "Pentagon", "Five Senses", 2016],
  ["Critical Beauty", "Pentagon", "CEREMONY", 2017],
  ["Like This", "Pentagon", "DEMO_01", 2017],
  ["RUNAWAY", "Pentagon", "DEMO_02", 2017],
  ["Shine", "Pentagon", "Positive", 2018],
  ["Naughty Boy", "Pentagon", "Thumbs Up!", 2018],
  ["COSMO", "Pentagon", "COSMO", 2019],
  ["SHA LA LA", "Pentagon", "Genie:us", 2019],
  ["Humph!", "Pentagon", "SUM(ME:R)", 2019],
  ["Dr. BeBe", "Pentagon", "UNIVERSE : THE BLACK HALL", 2020],
  ["Daisy", "Pentagon", "WE:TH", 2020],
  ["DO or NOT", "Pentagon", "LOVE or TAKE", 2021],
  ["Feelin' Like", "Pentagon", "IN:VITE U", 2022],
  ["POGO", "Pentagon", "POGO", 2023],
  ["With UNIVERSE", "Pentagon", "With UNIVERSE", 2023],
  ["365 FRESH", "Triple H", "199X", 2017],
  ["RETRO FUTURE", "Triple H", "REVOLUTION", 2018],
  ["POSE", "Kino", "POSE", 2022],
  ["Hmm BOCC", "Hui", "WHU IS ME : Complex", 2024],
  ["Navy Suited", "Wooseok", "Empty Paper", 2024],
  ["Goodbye with You", "Jinho", "CHOICE", 2024],
  ["Valkyrie", "ONEUS", "LIGHT US", 2019],
  ["Twilight", "ONEUS", "RAISE US", 2019],
  ["LIT", "ONEUS", "FLY WITH US", 2019],
  ["A Song Written Easily", "ONEUS", "IN ITS TIME", 2020],
  ["TO BE OR NOT TO BE", "ONEUS", "LIVED", 2020],
  ["No diggity", "ONEUS", "DEVIL", 2021],
  ["BLACK MIRROR", "ONEUS", "BINARY CODE", 2021],
  ["LUNA", "ONEUS", "BLOOD MOON", 2021],
  ["Bring it on", "ONEUS", "TRICKSTER", 2022],
  ["Same Scent", "ONEUS", "MALUS", 2022],
  ["Erase Me", "ONEUS", "PYGMALION", 2023],
  ["Baila Conmigo", "ONEUS", "La Dolce Vita", 2023],
  ["Now", "ONEUS", "NOW", 2024],
  ["Sad Payback", "Leedo & Xion", "La Dolce Vita", 2023],
  ["Gwangju Air", "Seoho", "Special Clip", 2021],
  ["Reminisce about All", "ONEWE", "1/4", 2019],
  ["Regulus", "ONEWE", "2/4", 2019],
  ["IF", "ONEWE", "3/4", 2020],
  ["End of Spring", "ONEWE", "ONE", 2020],
  ["A book in Memory", "ONEWE", "MEMORY : our book", 2020],
  ["Rain To Be", "ONEWE", "Planet Nine : Alter Ego", 2021],
  ["STAR", "ONEWE", "STAR", 2021],
  ["Universe_", "ONEWE", "Planet Nine : VOYAGER", 2022],
  ["Roommate", "ONEWE", "STUDIO WE : Recording #3", 2022],
  ["Still Here", "ONEWE", "INTACTUS", 2022],
  ["GRAVITY", "ONEWE", "GRAVITY", 2023],
  ["Beautiful Ashes", "ONEWE", "Planet Nine : ISOTROPIC", 2024],
  ["OFF ROAD", "ONEWE", "OFF ROAD", 2024],
  ["TIMELESS", "Giuk", "Psycho Xybernetics : TURN OVER", 2023],
  ["ON/OFF", "ONF", "ON/OFF", 2017],
  ["Complete", "ONF", "YOU COMPLETE ME", 2018],
  ["We Must Love", "ONF", "WE MUST LOVE", 2019],
  ["Why", "ONF", "GO LIVE", 2019],
  ["Sukhumvit Swimming", "ONF", "SPIN OFF", 2020],
  ["Beautiful Beautiful", "ONF", "ONF:MY NAME", 2021],
  ["Ugly Dance", "ONF", "CITY OF ONF", 2021],
  ["Popping", "ONF", "POPPING", 2021],
  ["Goosebumps", "ONF", "GOOSEBUMPS", 2021],
  ["Your Song", "ONF", "STORAGE OF ONF", 2022],
  ["Love Effect", "ONF", "LOVE EFFECT", 2023],
  ["Bye My Monster", "ONF", "BEAUTIFUL SHADOW", 2024],
  ["savanna", "OnlyOneOf", "dot point jump", 2019],
  ["sage", "OnlyOneOf", "line sun goodness", 2019],
  ["dora maar", "OnlyOneOf", "unknown art pop single", 2020],
  ["libido", "OnlyOneOf", "Instinct Part. 1", 2021],
  ["skinz", "OnlyOneOf", "Instinct Part. 2", 2022],
  ["seoul drift", "OnlyOneOf", "seoul collection", 2023],
  ["dopamine", "OnlyOneOf", "Things I Can't Say LOVE", 2024],
  ["begin", "YooJung", "undergrOund idOl #1", 2022],
  ["be free", "KB", "undergrOund idOl #2", 2022],
  ["Magic Girl", "Orange Caramel", "The First Mini Album", 2010],
  ["Aing", "Orange Caramel", "The Second Mini Album", 2010],
  ["Bangkok City", "Orange Caramel", "Bangkok City", 2011],
  ["Shanghai Romance", "Orange Caramel", "Shanghai Romance", 2011],
  ["Lipstick", "Orange Caramel", "Lipstick", 2012],
  ["Catallena", "Orange Caramel", "Catallena", 2014],
  ["My Copycat", "Orange Caramel", "My Copycat", 2014],
  ["WEE WOO", "Pristin", "HI! PRISTIN", 2017],
  ["WE LIKE", "Pristin", "SCHXXL OUT", 2017],
  ["Get It", "PRISTIN V", "Like a V", 2018],
  ["Jeon Won Diary", "T-ARA N4", "Jeon Won Diary", 2013],
  ["Like a Wind", "QBS", "Like a Wind", 2013],
  ["Doggedly", "SPICA", "Doggedly", 2012],
  ["Russian Roulette", "SPICA", "Russian Roulette", 2012],
  ["Pain", "SPICA", "Pain", 2012],
  ["I'll Be There", "SPICA", "I'll Be There", 2012],
  ["Lonely", "SPICA", "Lonely", 2012],
  ["Tonight", "SPICA", "Tonight", 2013],
  ["You Don't Love Me!", "SPICA", "You Don't Love Me!", 2014],
  ["Ghost", "SPICA", "Ghost", 2014],
  ["Secret Time", "SPICA", "Secret Time", 2016],
  ["Give Your Love", "SPICA.S", "Give Your Love", 2014],
  ["Memory", "Kim Boa", "Memory", 2018],
  ["I Want You Back", "Secret", "I Want You Back", 2009],
  ["Magic", "Secret", "Secret Time", 2010],
  ["Madonna", "Secret", "Madonna", 2010],
  ["Shy Boy", "Secret", "Shy Boy", 2011],
  ["Starlight Moonlight", "Secret", "Starlight Moonlight", 2011],
  ["Poison", "Secret", "POISON", 2012],
  ["Talk That", "Secret", "Talk That", 2012],
  ["YooHoo", "Secret", "Letter from Secret", 2013],
  ["I Do I Do", "Secret", "Gift From Secret", 2013],
  ["I'm In Love", "Secret", "SECRET SUMMER", 2014],
  ["Yesterday", "Song Ji Eun", "Yesterday", 2009],
  ["Into You", "Jun Hyo Seong", "FANTASIA", 2015],
  ["Generation", "tripleS", "Acid Angel from Asia", 2022],
  ["Rising", "tripleS", "ASSEMBLE", 2023],
  ["Cherry Talk", "tripleS", "+KR3S", 2023],
  ["Girls' Capitalism", "tripleS", "LOVElution", 2023],
  ["Invincible", "tripleS", "EVOLution", 2023],
  ["Door", "tripleS", "NXT", 2023],
  ["Girls Never Die", "tripleS", "ASSEMBLE24", 2024],
  ["Inner Dance", "tripleS", "Glow", 2024],
  ["Untitled", "tripleS", "Visionary Vision", 2024],
  ["Velocity", "tripleS", "Velocity", 2025],
  ["Chasing Stars", "tripleS", "Chasing Stars", 2025],
  ["Gossip Girl", "Rainbow", "Gossip Girl", 2009],
  ["A", "Rainbow", "A", 2010],
  ["Mach", "Rainbow", "Mach", 2010],
  ["To Me", "Rainbow", "SO 女", 2011],
  ["Sweet Dream", "Rainbow", "Sweet Dream", 2011],
  ["Tell Me Tell Me", "Rainbow", "Rainbow Syndrome Pt. 1", 2013],
  ["Sunshine", "Rainbow", "Rainbow Syndrome Pt. 2", 2013],
  ["Black Swan", "Rainbow", "Innocent", 2015],
  ["Whoo", "Rainbow", "Prism", 2016],
  ["Aurora", "Rainbow", "Over the Rainbow", 2019],
  ["Hoi Hoi", "Rainbow Pixie", "Hoi Hoi", 2012],
  ["Cha Cha", "Rainbow Blaxx", "RB BLAXX", 2014],
  ["Iratty", "Pink Fantasy", "Iratty", 2018],
  ["Fantasy", "Pink Fantasy", "Fantasy", 2019],
  ["Playing House", "Pink Fantasy", "Playing House", 2019],
  ["Shadow Play", "Pink Fantasy", "Shadow Play", 2020],
  ["Lemon Candy", "Pink Fantasy", "Lemon Candy", 2021],
  ["Poison", "Pink Fantasy", "Alice in Wonderland", 2021],
  ["Tales of the Unexpected", "Pink Fantasy", "Tales of the Unexpected", 2021],
  ["Get Out", "Pink Fantasy", "Get Out", 2022],
  ["12 O'Clock", "Pink Fantasy SHY", "12 O'Clock", 2019],
  ["Not Beautiful", "Pink Fantasy MDD", "Not Beautiful", 2019],
  ["Erasing", "Yechan", "Erasing", 2022],
  ["My Heart Skip a Beat", "Purple Kiss", "My Heart Skip a Beat", 2020],
  ["Ponzona", "Purple Kiss", "INTO VIOLET", 2021],
  ["Zombie", "Purple Kiss", "HIDE & SEEK", 2021],
  ["memeM", "Purple Kiss", "memeM", 2022],
  ["Nerdy", "Purple Kiss", "Geekyland", 2022],
  ["Sweet Juice", "Purple Kiss", "CABIN FEVER", 2023],
  ["7HEAVEN", "Purple Kiss", "FESTEST", 2023],
  ["BBB", "Purple Kiss", "HEADWAY", 2024],
  ["Overdrive", "Purple Kiss", "Overdrive", 2025],
  ["Twenty", "Swan", "Twenty", 2023],
  ["BOP BOP!", "VIVIZ", "Beam of Prism", 2022],
  ["LOVE BUFFET", "VIVIZ", "Summer Vibe", 2022],
  ["PULL UP", "VIVIZ", "VarioUS", 2023],
  ["MANIAC", "VIVIZ", "Versus", 2023],
  ["Full Moon", "VIVIZ", "Full Moon", 2024],
  ["Shining Star", "VIVIZ", "Shining Star", 2024],
  ["OPERA", "VIVIZ", "OPERA", 2025],
  ["ECLIPSE", "VIVIZ", "ECLIPSE", 2026],
  ["New Generation", "U-KISS", "New Generation", 2008],
  ["Man Man Ha Ni", "U-KISS", "Contiukiss", 2009],
  ["Bingeul Bingeul", "U-KISS", "Only One", 2010],
  ["Shut Up!", "U-KISS", "Break Time", 2010],
  ["0330", "U-KISS", "Bran New Kiss", 2011],
  ["Neverland", "U-KISS", "Neverland", 2011],
  ["Believe", "U-KISS", "The Special Kit", 2012],
  ["Stop Girl", "U-KISS", "Stop Girl", 2012],
  ["Standing Still", "U-KISS", "Collage", 2013],
  ["Break Up", "U-KISS", "Mono Scandal", 2014],
  ["Quiet Night", "U-KISS", "Always", 2015],
  ["Stalker", "U-KISS", "Stalker", 2016],
  ["Sacrifice", "U-KISS", "Sacrifice", 2017],
  ["FLY", "U-KISS", "FLY", 2017],
  ["The Wonderful Living", "U-KISS", "PLAY LIST", 2023],
  ["Evergreen", "U-KISS", "Evergreen", 2024],
  ["I'll Be There", "Soohyun", "Soohyun's Inside Out", 2022],
  ["You Are My Life", "Hoon", "You Are My Life", 2021],
  ["MoMoMo", "WJSN", "WOULD YOU LIKE?", 2016],
  ["Secret", "WJSN", "THE SECRET", 2016],
  ["I Wish", "WJSN", "FROM. WJSN", 2017],
  ["Happy", "WJSN", "HAPPY MOMENT", 2017],
  ["Dreams Come True", "WJSN", "DREAM YOUR DREAM", 2018],
  ["Save Me, Save You", "WJSN", "WJ PLEASE?", 2018],
  ["La La Love", "WJSN", "WJ STAY?", 2019],
  ["Boogie Up", "WJSN", "FOR THE SUMMER", 2019],
  ["As You Wish", "WJSN", "AS YOU WISH", 2019],
  ["Butterfly", "WJSN", "NEVERLAND", 2020],
  ["UNNATURAL", "WJSN", "UNNATURAL", 2021],
  ["Let Me In", "WJSN", "Let Me In", 2021],
  ["Last Sequence", "WJSN", "SEQUENCE", 2022],
  ["Bloom hour", "WJSN", "Bloom hour", 2026],
  ["Hump Hair", "WJSN Chocome", "Hump Hair", 2020],
  ["Easy", "WJSN The Black", "My Attitude", 2021],
  ["Without U", "SeolA", "Inside Out", 2024],
  ["Breathe", "Yeonjung", "Breathe", 2020],
  ["Shooting Star", "Dawon (WJSN)", "Shooting Star", 2015],
  ["Irony", "Wonder Girls", "The Wonder Begins", 2007],
  ["Tell Me", "Wonder Girls", "The Wonder Years", 2007],
  ["So Hot", "Wonder Girls", "So Hot", 2008],
  ["Nobody", "Wonder Girls", "The Wonder Years – Trilogy", 2008],
  ["2 Different Tears", "Wonder Girls", "2 Different Tears", 2010],
  ["Be My Baby", "Wonder Girls", "Wonder World", 2011],
  ["Like This", "Wonder Girls", "Wonder Party", 2012],
  ["The DJ is Mine", "Wonder Girls", "The DJ is Mine", 2012],
  ["Like Money", "Wonder Girls", "Like Money", 2012],
  ["Baby Don't Play", "Wonder Girls", "Reboot", 2015],
  ["Why So Lonely", "Wonder Girls", "Why So Lonely", 2016],
  ["Draw Me", "Wonder Girls", "Draw Me", 2017],
  ["Tippy Tap", "XG", "Tippy Tap", 2021],
  ["Mascara", "XG", "Mascara", 2022],
  ["Shooting Star", "XG", "Shooting Star", 2023],
  ["GRL GVNG", "XG", "NEW DNA", 2023],
  ["WOKE UP", "XG", "WOKE UP", 2024],
  ["SOMETHING AIN'T RIGHT", "XG", "AWE", 2024],
  ["BIZCOCHITO", "XG", "BIZCOCHITO", 2025],
  ["SUPERIOR", "XG", "SUPERIOR", 2025],
  ["XIGNAL (The Intro)", "XG", "THE CORE", 2026],
  ["In Bloom", "ZEROBASEONE", "YOUTH IN THE SHADE", 2023],
  ["MELTING POINT", "ZEROBASEONE", "MELTING POINT", 2023],
  ["Yura Yura", "ZEROBASEONE", "Yura Yura", 2024],
  ["SWEAT", "ZEROBASEONE", "You had me at HELLO", 2024],
  ["GOOD SO BAD", "ZEROBASEONE", "CINEMA PARADISE", 2024],
  ["NOW OR NEVER", "ZEROBASEONE", "NOW OR NEVER", 2025],
  ["Doctor! Doctor!", "ZEROBASEONE", "BLUE PARADISE", 2025],
  ["SLAM DUNK", "ZEROBASEONE", "NEVER SAY NEVER", 2025],
  ["Running to Future", "ZEROBASEONE", "RE-FLOW", 2026],
  ["Intro", "ZEROBASEONE", "Ascend-", 2026],
  ["Energetic", "WANNAONE", "1X1=1 (TO BE ONE)", 2017],
  ["Beautiful", "WANNAONE", "1-1=0 (NOTHING WITHOUT YOU)", 2017],
  ["I.P.U.", "WANNAONE", "0+1=1 (I PROMISE YOU)", 2018],
  ["Light", "WANNAONE", "1÷x=1 (UNDIVIDED)", 2018],
  ["Spring Breeze", "WANNAONE", "11=1 (POWER OF DESTINY)", 2018],
  ["B-Side", "WANNAONE", "B-Side", 2022],
  ["Aside", "Yoon Ji-sung", "Aside", 2019],
  ["Dear Diary", "Yoon Ji-sung", "Dear diary", 2019],
  ["Love Song", "Yoon Ji-sung", "Temperature of Love", 2021],
  ["Bloom", "Yoon Ji-sung", "Random_o", 2022],
  ["Bird", "Ha Sung-woon", "My Moment", 2019],
  ["Blue", "Ha Sung-woon", "B-Side", 2019],
  ["Twilight", "Ha Sung-woon", "Twilight", 2019],
  ["Think About You", "Ha Sung-woon", "Select", 2020],
  ["Forbidden Island", "Ha Sung-woon", "Mirage", 2020],
  ["Sneakers", "Ha Sung-woon", "Sneakers", 2021],
  ["Electrified", "Ha Sung-woon", "Electrified: Goodbye", 2021],
  ["Focus", "Ha Sung-woon", "Strange World", 2022],
  ["Universe", "Hwang Min-hyun", "Happily Ever After", 2019],
  ["Hidden Side", "Hwang Min-hyun", "Truth or Lie", 2023],
  ["Luminous", "Hwang Min-hyun", "Luminous", 2024],
  ["We Belong", "Ong Seong-wu", "Layers", 2020],
  ["Designer", "Kim Jae-hwan", "Another", 2019],
  ["The Time I Need", "Kim Jae-hwan", "Moment", 2019],
  ["I Wouldn't Look For You", "Kim Jae-hwan", "I Wouldn't Look For You", 2021],
  ["Burned All Black", "Kim Jae-hwan", "The Letter", 2021],
  ["Dripin'", "Kim Jae-hwan", "Empty Dream", 2022],
  ["Love Radar", "Kim Jae-hwan", "Jamboree", 2024],
  ["Color Eye", "Kang Daniel", "Color on Me", 2019],
  ["Touchin'", "Kang Daniel", "Touchin'", 2019],
  ["2U", "Kang Daniel", "Cyan", 2020],
  ["Who U Are", "Kang Daniel", "Magenta", 2020],
  ["State of Wonder", "Kang Daniel", "State of Wonder", 2021],
  ["Paranoia", "Kang Daniel", "Paranoia", 2021],
  ["Antidote", "Kang Daniel", "Yellow", 2021],
  ["Upside Down", "Kang Daniel", "The Story", 2022],
  ["Ghost Town", "Kang Daniel", "Ghost Town", 2022],
  ["SOS", "Kang Daniel", "Realiez", 2023],
  ["Electric Shock", "Kang Daniel", "Electric Shock", 2024],
  ["Act", "Kang Daniel", "Act", 2024],
  ["L.O.V.E", "Park Ji-hoon", "O'Clock", 2019],
  ["Hurricane", "Park Ji-hoon", "360", 2019],
  ["Wing", "Park Ji-hoon", "The W", 2020],
  ["Gotcha", "Park Ji-hoon", "Message", 2020],
  ["Gallery", "Park Ji-hoon", "My Collection", 2021],
  ["Not Alone", "Park Ji-hoon", "Not Alone", 2021],
  ["Nitro", "Park Ji-hoon", "The Answer", 2022],
  ["Blank Effect", "Park Ji-hoon", "Blank or Black", 2023],
  ["Self-Portrait", "Park Woo-jin", "The Square", 2023],
  ["Hard to Say Goodbye", "Bae Jin-young", "Hard to Say Goodbye", 2019],
  ["Cinema", "Bae Jin-young", "Polaris", 2022],
  ["Rose", "Lee Dae-hwi", "Breathe", 2019],
  ["I'm a Star", "Lai Kuan-lin", "9801", 2019],
  ["Badge", "WOOAH", "EXCLAMATION", 2020],
  ["Catch the Stars", "WOOAH", "Catch the Stars", 2022],
  ["Purple", "WOOAH", "JOY", 2022],
  ["BLUSH", "WOOAH", "BLUSH", 2024],
  ["POM POM POM", "WOOAH", "UNBLUSHED", 2024],
  ["GLOW", "WOOAH", "GLOW", 2024],
  ["SHINE", "WOOAH", "SHINE", 2025],
  ["No Playboy", "9Muses", "Let's Have a Party", 2010],
  ["Figaro", "9Muses", "Figaro", 2011],
  ["News", "9Muses", "News", 2012],
  ["Ticket", "9Muses", "Sweet Rendezvous", 2012],
  ["Wild", "9Muses", "Wild", 2013],
  ["Gun", "9Muses", "Prima Donna", 2013],
  ["Drama", "9Muses", "Drama", 2015],
  ["Sleepyhead", "9Muses", "Lost", 2015],
  ["Lip 2 Lip", "9Muses", "Muses Diary", 2016],
  ["Remember", "9Muses", "Identity", 2017],
  ["Love City", "9Muses", "Love City", 2017],
  ["Domino", "1THE9", "XIX", 2019],
  ["Blah", "1THE9", "Blah Blah", 2019],
  ["Bad Guy", "1THE9", "Turn Over", 2020],
  ["DMT", "3YE", "First Album Blooming Blue", 2019],
  ["OOMM", "3YE", "OOMM", 2019],
  ["Queen", "3YE", "Queen", 2020],
  ["YESSIR", "3YE", "TRIANGLE", 2020],
  ["HALA", "3YE", "HALA", 2020],
  ["Because Of You", "3YE", "Because Of You", 2023],
  ["Shooting Star", "Dawon (SF9)", "Sequence", 2024],
  ["Rock & Roll", "ITZY", "Collector", 2025],
  ["Voltage", "ITZY", "Voltage", 2022],
  ["Blah Blah Blah", "ITZY", "Blah Blah Blah", 2022],
  ["Ringo", "ITZY", "Ringo", 2023],
  ["Highs and Lows", "Wonpil", "Unpiltered", 2026],
  ["Dream Bus", "Day6", "The Decade", 2025],
  ["Inside Out", "Day6", "The Decade", 2025],
  ["Maybe Tomorrow", "Day6", "Maybe Tomorrow", 2025],
  ["Game Over", "Day6", "Maybe Tomorrow", 2025],
  ["Lovin' the Christmas", "Day6", "Lovin' the Christmas", 2025],
  ["Python", "GOT7", "Winter Heptagon", 2025],
  ["Nice to see you again", "TWS", "Nice to see you again", 2025],
  ["BLOOM (feat. Ayumu Imazu)", "TWS", "Nice to see you again", 2025],
  ["Nice to see you again (Korean Ver.)", "TWS", "Nice to see you again (Korean Ver.)", 2026],
  ["SODA SODA", "TWS", "SODA SODA", 2026],
  ["Crown", "EXO", "Reverxe", 2026],
  ["Back It Up", "EXO", "Reverxe", 2026],
  ["Crazy", "EXO", "Reverxe", 2026],
  ["Suffocate", "EXO", "Reverxe", 2026],
  ["Moonlight Shadows", "EXO", "Reverxe", 2026],
  ["Back Pocket", "EXO", "Reverxe", 2026],
  ["Touch & Go", "EXO", "Reverxe", 2026],
  ["Flatline", "EXO", "Reverxe", 2026],
  ["I'm Home", "EXO", "Reverxe", 2026],
  ["Git It Up!", "EXO", "2025 SMTOWN: The Culture, The Future", 2025],
  ["Express Mode", "Super Junior", "Super Junior25", 2025],
  ["Promise", "Super Junior-83z", "Promise", 2026],
  ["Go High", "Super Junior-D&E", "Inevitable", 2024],
  ["Break", "Super Junior-D&E", "Inevitable", 2024],
  ["Run Away", "Super Junior-D&E", "Inevitable", 2024],
  ["Only You", "Super Junior-D&E", "Inevitable", 2024],
  ["Eau de Perfume", "Super Junior-D&E", "Inevitable", 2024],
  ["Tsuki no Ura de Aimashou", "TVXQ!", "Tsuki no Ura de Aimashou", 2025],
  ["Utsuroi", "TVXQ!", "Utsuroi", 2022],
  ["Lime & Lemon", "TVXQ!", "Lime & Lemon", 2023],
  ["Anata wo Kazoete", "BoA & TVXQ!", "Anata wo Kazoete", 2026],
  ["Sugar", "Jungwoo", "Sugar", 2025],
  ["One More Dance", "Joshua", "One More Dance", 2026],
  ["Better Half (feat. Omoinotake)", "Jeonghan", "Better Half", 2025],
  ["Never Losing", "DK", "Never Losing", 2026],
  ["Love Is Gone", "SLANDER, Seventeen & Joshua", "Love Is Gone", 2025],
  ["Tiny Light", "Seventeen", "Tiny Light", 2026],
  ["Serenade", "DxS", "Serenade", 2025],
  ["Echo", "Jin", "Echo", 2025],
  ["Sweet Dreams (feat. Miguel)", "J-Hope", "Sweet Dreams", 2025],
  ["Mona Lisa", "J-Hope", "Mona Lisa", 2025],
  ["Killin' It Girl (feat. GloRilla)", "J-Hope", "Killin' It Girl", 2025],
  ["With You", "Jimin & Ha Sung-woon", "With You", 2022],
  ["Different", "LE SSERAFIM", "Different", 2025],
  ["The Noise", "LE SSERAFIM & Yoasobi", "The Noise", 2025],
  ["So Cynical (Badum)", "LE SSERAFIM", "Hot", 2025],
  ["Boompala", "LE SSERAFIM", "Boompala", 2026],
  ["Pureflow", "LE SSERAFIM", "Pureflow, Pt. 1", 2026],
  ["Pit Stop", "NJZ", "Pit Stop", 2025],
  ["If I Say, I Love You", "BOYNEXTDOOR", "If I Say, I Love You", 2025],
  ["I Feel Good", "BOYNEXTDOOR", "No Genre", 2025],
  ["Count to Love", "BOYNEXTDOOR", "BOYLIFE", 2025],
  ["Hollywood Action", "BOYNEXTDOOR", "The Action", 2025],
  ["Say Cheese!", "BOYNEXTDOOR", "Say Cheese!", 2025],
  ["Ddok Ddok Ddok", "BOYNEXTDOOR", "Home", 2026],
  ["Viral", "BOYNEXTDOOR", "Home", 2026],
  ["Viral (Santos Bravos Remix)", "BOYNEXTDOOR & Santos Bravos", "Viral (Remixes)", 2026],
  ["Viral (AiNA THE END Remix)", "BOYNEXTDOOR & AiNA THE END", "Viral (Remixes)", 2026],
  ["Earth, Wind & Fire (Buldak Hotter Than My Ex Ver.)", "BOYNEXTDOOR", "Earth, Wind & Fire (Buldak Ver.)", 2026],
  ["Attention", "NewJeans", "New Jeans", 2022],
  ["Hype Boy", "NewJeans", "New Jeans", 2022],
  ["Cookie", "NewJeans", "New Jeans", 2022],
  ["Hurt", "NewJeans", "New Jeans", 2022],
  ["Ditto", "NewJeans", "OMG", 2022],
  ["OMG", "NewJeans", "OMG", 2023],
  ["Zero", "NewJeans", "Zero", 2023],
  ["New Jeans", "NewJeans", "Get Up", 2023],
  ["Super Shy", "NewJeans", "Get Up", 2023],
  ["ETA", "NewJeans", "Get Up", 2023],
  ["Cool With You", "NewJeans", "Get Up", 2023],
  ["Get Up", "NewJeans", "Get Up", 2023],
  ["ASAP", "NewJeans", "Get Up", 2023],
  ["Gods", "NewJeans", "Gods", 2023],
  ["How Sweet", "NewJeans", "How Sweet", 2024],
  ["Bubble Gum", "NewJeans", "How Sweet", 2024],
  ["Supernatural", "NewJeans", "Supernatural", 2024],
  ["Right Now", "NewJeans", "Supernatural", 2024],
  ["Go", "BLACKPINK", "Deadline", 2026],
  ["BiiiG", "BIGBANG", "BiiiG", 2026],
  ["Home Sweet Home (feat. Taeyang & Daesung)", "G-Dragon", "Übermensch", 2024],
  ["Power", "G-Dragon", "Übermensch", 2024],
  ["Studio54)", "T.O.P", "T.O.P", 2026],
  ["Desperado", "T.O.P", "T.O.P", 2026],
  ["PARADISE", "TREASURE", "LOVE PULSE", 2025],
  ["Everything", "TREASURE", "LOVE PULSE", 2025],
  ["Now Forever", "TREASURE", "LOVE PULSE", 2025],
  ["Better Than Me", "TREASURE", "LOVE PULSE", 2025],
  ["Reverse", "TREASURE", "Reverse", 2024],
  ["Ghost", "BabyMonster", "Ghost", 2025],
  ["Hot Sauce", "BabyMonster", "Hot Sauce", 2025],
  ["We Go Up", "BabyMonster", "We Go Up", 2025],
  ["Choom", "BabyMonster", "Choom", 2026],
  ["Sugar Honey Ice Tea", "BabyMonster", "Sugar Honey Ice Tea", 2026],
];

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
function hexToRgb(hex) {
  const h = (hex || "#888888").replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(n, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}
function lerpColor(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}
function getScoreColor(list, score, fallback) {
  if (score == null) return fallback;
  const mode = list.scoreColorMode || "single";
  if (mode === "single") return list.scoreColorSingle || fallback;
  if (mode === "gradient") return lerpColor(list.scoreGradientFrom || fallback, list.scoreGradientTo || fallback, Math.max(0, Math.min(1, score / (list.scoreScale || 100))));
  if (mode === "thresholds") {
    const stops = [...(list.scoreColorStops || [])].sort((a, b) => a.score - b.score);
    if (!stops.length) return fallback;
    let chosen = stops[0].color;
    stops.forEach((s) => { if (score >= s.score) chosen = s.color; });
    return chosen;
  }
  return fallback;
}

const DEFAULT_CATEGORIES = () => [{ id: "cat-default", name: "Score", weight: 100, max: 100 }];
const DEFAULT_TIERS = () => ["SSS", "SS", "S", "A", "B", "C"].map((n, i) => ({ id: `tier-${n}`, name: n, color: TIER_PALETTE[i % TIER_PALETTE.length] }));

function effectiveScore(list, song) {
  if (!list.advancedMode) return song.score;
  const cats = list.categories && list.categories.length ? list.categories : DEFAULT_CATEGORIES();
  const mode = list.advancedScoreMode || "sum";
  if (mode === "sum") {
    let total = 0, any = false;
    cats.forEach((c) => {
      const val = song.categoryScores?.[c.id];
      if (val === null || val === undefined || val === "") return;
      total += Number(val); any = true;
    });
    return any ? total : null;
  }
  let weightedSum = 0, weightTotal = 0;
  cats.forEach((c) => {
    const val = song.categoryScores?.[c.id];
    if (val === null || val === undefined || val === "") return;
    weightedSum += (Number(val) / 100) * c.weight;
    weightTotal += c.weight;
  });
  if (weightTotal === 0) return null;
  return Math.round((weightedSum / weightTotal) * list.scoreScale * 10) / 10;
}
function autoTierFor(list, score) {
  if (score == null) return "NULL";
  const rules = [...(list.autoTierRules || [])].sort((a, b) => b.minScore - a.minScore);
  const match = rules.find((r) => score >= r.minScore);
  return match ? match.tierName : "NULL";
}
function displayTier(list, song, score) {
  if (list.autoTier && !song.tierLocked) return autoTierFor(list, score);
  return song.tier || "";
}
function tierColorFor(list, tierValue) {
  const t = (list.tierNames || []).find((x) => x.name === tierValue);
  return t ? t.color : MUTED;
}
function cardSizeFor(rank) {
  if (rank === 1) return "hero";
  if (rank <= 3) return "large";
  if (rank <= 10) return "medium";
  return "standard";
}
const CARD_DIMS = {
  hero: { width: 220, artist: 12, title: 19, rank: 30, score: 13 },
  large: { width: 168, artist: 11, title: 15, rank: 24, score: 12 },
  medium: { width: 126, artist: 10, title: 12.5, rank: 19, score: 11 },
  standard: { width: 102, artist: 9, title: 11, rank: 16, score: 10 },
};

// Locked songs hold their exact chosen position; everything else fills in
// around them by score, using standard competition ranking among themselves.
function computeRanks(list) {
  const songs = (list.songs || []).map((s) => ({ ...s, _score: effectiveScore(list, s) }));
  const locked = songs.filter((s) => s.lockedRank != null).sort((a, b) => a.lockedRank - b.lockedRank || (b._score ?? -1) - (a._score ?? -1));
  const unlockedSorted = songs.filter((s) => s.lockedRank == null).sort((a, b) => (b._score ?? -1) - (a._score ?? -1));
  const unlockedWithRank = unlockedSorted.map((s) => ({ ...s, _urank: 1 + unlockedSorted.filter((o) => (o._score ?? -1) > (s._score ?? -1)).length }));
  const result = [];
  let li = 0, ui = 0, pos = 1;
  while (li < locked.length || ui < unlockedWithRank.length) {
    if (li < locked.length && locked[li].lockedRank <= pos) { result.push({ ...locked[li], rank: locked[li].lockedRank, isLocked: true }); li++; }
    else if (ui < unlockedWithRank.length) { result.push({ ...unlockedWithRank[ui], rank: pos, isLocked: false }); ui++; pos++; }
    else { result.push({ ...locked[li], rank: locked[li].lockedRank, isLocked: true }); li++; }
  }
  return result;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose}>
      <div style={{ background: CARD, borderRadius: 14, padding: 22, width: wide ? 620 : 440, maxWidth: "100%", maxHeight: "85vh", overflowY: "auto", border: `1px solid ${BORDER}` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="display" style={{ fontSize: 22, color: TEXT }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BgImg({ src }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return null;
  return <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
}

const DEFAULT_LIST = () => ({
  id: "default", name: "All Kpop Songs Ranked", tags: [], createdAt: Date.now(), songs: [],
  scoreScale: 100, showScore: true, showTier: true, autoArtistImages: false,
  advancedMode: false, advancedScoreMode: "sum", categories: DEFAULT_CATEGORIES(),
  tierNames: DEFAULT_TIERS(), autoTier: false, autoTierRules: [],
  scoreColorMode: "single", scoreColorSingle: "#FFC857", scoreGradientFrom: "#5FD9C0", scoreGradientTo: "#FF3D7F", scoreColorStops: [],
});

export default function KpopRanker() {
  const [username, setUsername] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState("");
  const [avatarBroken, setAvatarBroken] = useState(false);

  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [rankMode, setRankMode] = useState("detailed");
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({});
  const [notePopoverFor, setNotePopoverFor] = useState(null);
  const [awardDrafts, setAwardDrafts] = useState({});
  const [awardPickerFor, setAwardPickerFor] = useState(null);
  const [listDropdownOpen, setListDropdownOpen] = useState(false);
  const [expandedAlbums, setExpandedAlbums] = useState({});
  const [expandedArtists, setExpandedArtists] = useState({});
  const [artistImages, setArtistImages] = useState({});
  const artistImageFetching = useRef(new Set());

  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRemove, setShowRemove] = useState(false);
  const [showListOptions, setShowListOptions] = useState(false);
  const [confirmArtist, setConfirmArtist] = useState(null);
  const [confirmDeleteList, setConfirmDeleteList] = useState(false);
  const [recentAdds, setRecentAdds] = useState([]);

  const [bulkText, setBulkText] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newArtist, setNewArtist] = useState("");
  const [newAlbum, setNewAlbum] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newScore, setNewScore] = useState("");
  const [newTier, setNewTier] = useState("");
  const [newBg, setNewBg] = useState("");
  const [newListName, setNewListName] = useState("");
  const [newListTags, setNewListTags] = useState("");
  const [newListScale, setNewListScale] = useState(100);

  const [rankQuery, setRankQuery] = useState("");
  const [searchIn, setSearchIn] = useState({ song: true, artist: true, album: true });
  const [sortBy, setSortBy] = useState("desc");

  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewExisting, setReviewExisting] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewDraft, setReviewDraft] = useState({ score: "", tier: "", bgImage: "", categoryScores: {}, awardEmoji: "", awardLabel: "", note: "" });
  const [reviewAwardPicker, setReviewAwardPicker] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [pendingBigAdd, setPendingBigAdd] = useState([]);
  const [pendingBigAddLabel, setPendingBigAddLabel] = useState("");
  const [showBigAddConfirm, setShowBigAddConfirm] = useState(false);

  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [addConfirmItems, setAddConfirmItems] = useState([]);
  const [addConfirmChecked, setAddConfirmChecked] = useState({});
  const [addConfirmLabel, setAddConfirmLabel] = useState("");
  const [addConfirmBg, setAddConfirmBg] = useState("");

  const [newRuleScore, setNewRuleScore] = useState("");
  const [newRuleTier, setNewRuleTier] = useState("");
  const dragTierIndex = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [listsRes, nameRes, themeRes, activeRes, modeRes, avatarRes, viewRes] = await Promise.allSettled([
          window.storage.get("kpop-lists", true),
          window.storage.get("kpop-username", false),
          window.storage.get("kpop-theme", false),
          window.storage.get("kpop-active-list", false),
          window.storage.get("kpop-rank-mode", false),
          window.storage.get("kpop-avatar", false),
          window.storage.get("kpop-view-mode", false),
        ]);
        let loadedLists = [];
        if (listsRes.status === "fulfilled" && listsRes.value) loadedLists = JSON.parse(listsRes.value.value);
        loadedLists = loadedLists.map((l) => {
          const rawTiers = l.tierNames && l.tierNames.length ? l.tierNames : DEFAULT_TIERS();
          const tierNames = rawTiers.map((t, i) => (typeof t === "string" ? { id: `tier-${i}-${t}`, name: t, color: TIER_PALETTE[i % TIER_PALETTE.length] } : t));
          return { ...DEFAULT_LIST(), ...l, tierNames, id: l.id, songs: (l.songs || []).map((s) => ({ notes: s.comments || s.notes || [], bgImage: s.bgImage || "", ...s })) };
        });
        if (!loadedLists.length) { loadedLists = [DEFAULT_LIST()]; window.storage.set("kpop-lists", JSON.stringify(loadedLists), true).catch(() => {}); }
        setLists(loadedLists);
        let active = loadedLists[0].id;
        if (activeRes.status === "fulfilled" && activeRes.value) {
          const savedId = JSON.parse(activeRes.value.value);
          if (loadedLists.some((l) => l.id === savedId)) active = savedId;
        }
        setActiveListId(active);
        if (nameRes.status === "fulfilled" && nameRes.value) setUsername(JSON.parse(nameRes.value.value));
        if (themeRes.status === "fulfilled" && themeRes.value) setTheme({ ...DEFAULT_THEME, ...JSON.parse(themeRes.value.value) });
        if (modeRes.status === "fulfilled" && modeRes.value) setRankMode(JSON.parse(modeRes.value.value));
        else setRankMode("detailed");
        if (avatarRes.status === "fulfilled" && avatarRes.value) setAvatarUrl(JSON.parse(avatarRes.value.value));
        if (viewRes.status === "fulfilled" && viewRes.value) setViewMode(JSON.parse(viewRes.value.value));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  const activeList = lists.find((l) => l.id === activeListId) || lists[0] || DEFAULT_LIST();
  const scoreScale = activeList.scoreScale || 100;

  async function saveLists(updated) {
    setLists(updated);
    try { await window.storage.set("kpop-lists", JSON.stringify(updated), true); } catch (e) { setError("Couldn't save — try again."); }
  }
  function updateActiveSongs(updater) { saveLists(lists.map((l) => (l.id === activeListId ? { ...l, songs: updater(l.songs) } : l))); }
  function updateActiveList(patch) { saveLists(lists.map((l) => (l.id === activeListId ? { ...l, ...patch } : l))); }

  async function switchList(id) {
    setActiveListId(id); setExpandedId(null); setListDropdownOpen(false);
    try { await window.storage.set("kpop-active-list", JSON.stringify(id), false); } catch (e) {}
  }
  function createList() {
    const name = newListName.trim();
    if (!name) return;
    const id = `list-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const tags = newListTags.split(",").map((t) => t.trim()).filter(Boolean);
    saveLists([...lists, { ...DEFAULT_LIST(), id, name, tags, scoreScale: newListScale, createdAt: Date.now(), songs: [] }]);
    switchList(id);
    setNewListName(""); setNewListTags(""); setNewListScale(100);
    setShowNewList(false);
    setShowListOptions(true);
  }
  function exportList(format = "json") {
    const rows = ranked.map((s) => ({
      rank: s.rank,
      title: s.title,
      artist: s.artist,
      album: s.album,
      year: s.year,
      score: s.score ?? null,
      effectiveScore: effectiveScore(activeList, s),
      categoryScores: s.categoryScores || {},
      tier: s.tier || "",
      awards: (s.awards || []).map((a) => ({ emoji: a.emoji, label: a.label, highlighted: !!a.highlighted })),
      notes: (s.notes || []).map((n) => ({ author: n.author, text: n.text, ts: n.ts })),
      addedBy: s.addedBy || "",
    }));
    const payload = {
      listName: activeList.name,
      tags: activeList.tags,
      scoreScale: activeList.scoreScale,
      advancedMode: activeList.advancedMode,
      advancedScoreMode: activeList.advancedScoreMode,
      exportedAt: new Date().toISOString(),
      songs: rows,
    };
    const filenameBase = activeList.name.replace(/[^a-z0-9]+/gi, "_");
    let blob, filename;
    if (format === "txt") {
      const lines = rows.map((r) => {
        const parts = [r.rank, r.title, r.artist, r.album || "—", r.year || "—", r.score ?? "—", r.tier || "—"];
        const awardsStr = r.awards.length ? " " + r.awards.map((a) => a.emoji + (a.highlighted ? "*" : "")).join(" ") : "";
        return parts.join(" | ") + awardsStr;
      });
      const header = `${payload.listName}${payload.tags ? " — " + payload.tags : ""}\nExported ${new Date(payload.exportedAt).toLocaleString()}\nScore scale: /${payload.scoreScale}\n\nRank | Title | Artist | Album | Year | Score | Tier | Awards\n${"-".repeat(60)}\n`;
      blob = new Blob([header + lines.join("\n")], { type: "text/plain" });
      filename = `${filenameBase}.txt`;
    } else {
      blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      filename = `${filenameBase}.json`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function duplicateList() {
    const id = `list-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const clone = {
      ...activeList, id, name: `${activeList.name} (copy)`, createdAt: Date.now(),
      songs: activeList.songs.map((s) => ({ ...s, id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}` })),
      tierNames: activeList.tierNames.map((t) => ({ ...t })),
      categories: (activeList.categories || []).map((c) => ({ ...c })),
      autoTierRules: (activeList.autoTierRules || []).map((r) => ({ ...r })),
      scoreColorStops: (activeList.scoreColorStops || []).map((s) => ({ ...s })),
    };
    saveLists([...lists, clone]);
    switchList(id);
    setShowListOptions(false);
  }
  function deleteActiveList() {
    const remaining = lists.filter((l) => l.id !== activeList.id);
    const finalLists = remaining.length ? remaining : [DEFAULT_LIST()];
    saveLists(finalLists);
    switchList(finalLists[0].id);
    setConfirmDeleteList(false);
    setShowListOptions(false);
  }

  async function saveTheme(updated) { setTheme(updated); try { await window.storage.set("kpop-theme", JSON.stringify(updated), false); } catch (e) {} }
  async function saveRankMode(mode) { setRankMode(mode); try { await window.storage.set("kpop-rank-mode", JSON.stringify(mode), false); } catch (e) {} }
  async function saveViewMode(mode) { setViewMode(mode); try { await window.storage.set("kpop-view-mode", JSON.stringify(mode), false); } catch (e) {} }
  async function saveAvatar(url) { setAvatarUrl(url); setAvatarBroken(false); try { await window.storage.set("kpop-avatar", JSON.stringify(url), false); } catch (e) {} }
  async function confirmName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setUsername(trimmed); setEditingName(false);
    try { await window.storage.set("kpop-username", JSON.stringify(trimmed), false); } catch (e) {}
  }

  function makeSongObj({ title, artist, album, year, score, tier, bgImage, categoryScores, awards, notes }) {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title, artist, album: album || "", year: year || null,
      score: score ?? null, categoryScores: categoryScores || {}, tier: tier || "", tierLocked: !!tier,
      lockedRank: null, awards: awards || [], bgImage: bgImage || "",
      addedBy: username, createdAt: Date.now(),
      notes: notes || [],
    };
  }

  function recordAdd(label, songIds) {
    if (!songIds.length) return;
    setRecentAdds((prev) => [{ id: `hist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, label, songIds, ts: Date.now() }, ...prev].slice(0, 5));
  }
  function undoAdd(entry) {
    updateActiveSongs((songs) => songs.filter((s) => !entry.songIds.includes(s.id)));
    setRecentAdds((prev) => prev.filter((e) => e.id !== entry.id));
  }

  function addSong() {
    if (!newTitle.trim() || !newArtist.trim()) return;
    const song = makeSongObj({
      title: newTitle.trim(), artist: newArtist.trim(), album: newAlbum.trim(),
      year: newYear === "" ? null : Number(newYear),
      score: newScore === "" ? null : Math.min(scoreScale, Number(newScore)),
      tier: newTier.trim(), bgImage: newBg.trim(),
    });
    updateActiveSongs((songs) => [song, ...songs]);
    recordAdd(`${song.title} — ${song.artist}`, [song.id]);
    setNewTitle(""); setNewArtist(""); setNewAlbum(""); setNewYear("");
    setNewScore(""); setNewTier(""); setNewBg("");
    setShowAdd(false);
  }

  const bulkParsed = useMemo(() => {
    return bulkText.split("\n").map((l) => l.trim()).filter(Boolean).map((line) => {
      const cols = (line.includes("\t") ? line.split("\t") : line.split(",")).map((c) => c.trim());
      const [title, artist, album, year, score, tier] = cols;
      return {
        title: title || "", artist: artist || "", album: album || "",
        year: year && !isNaN(Number(year)) ? Number(year) : null,
        score: score !== undefined && score !== "" && !isNaN(Number(score)) ? Number(score) : null,
        tier: tier || "",
      };
    }).filter((s) => s.title);
  }, [bulkText]);

  function parseExportedTxt(text) {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const songs = [];
    for (const line of lines) {
      if (!line.includes("|")) continue;
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length < 3) continue;
      const rankNum = Number(parts[0]);
      if (!Number.isFinite(rankNum) || parts[1] === "Title") continue;
      const [, title, artist, album, year, score, tier] = parts;
      songs.push({
        title: title || "",
        artist: artist || "",
        album: album && album !== "—" ? album : "",
        year: year && year !== "—" && !isNaN(Number(year)) ? Number(year) : null,
        score: score && score !== "—" && !isNaN(Number(score)) ? Number(score) : null,
        tier: tier && tier !== "—" ? tier : "",
      });
    }
    return songs.filter((s) => s.title);
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      if (file.name.toLowerCase().endsWith(".json")) {
        try {
          const data = JSON.parse(text);
          const rows = Array.isArray(data) ? data : (data.songs || []);
          const newSongs = rows.map((r) => makeSongObj({
            title: r.title, artist: r.artist, album: r.album, year: r.year,
            score: r.score, tier: r.tier, categoryScores: r.categoryScores,
            awards: r.awards, notes: r.notes,
          })).filter((s) => s.title);
          if (!newSongs.length) { setError("No songs found in that file."); return; }
          updateActiveSongs((songs) => [...newSongs, ...songs]);
          recordAdd(`Imported ${newSongs.length} song${newSongs.length === 1 ? "" : "s"}`, newSongs.map((s) => s.id));
          setShowImport(false);
        } catch (err) { setError("Couldn't read that JSON file — make sure it's a list exported from this app."); }
      } else {
        if (text.includes(" | ")) {
          const parsed = parseExportedTxt(text);
          if (!parsed.length) { setError("No songs found in that file."); return; }
          const newSongs = parsed.map((s) => makeSongObj(s));
          updateActiveSongs((songs) => [...newSongs, ...songs]);
          recordAdd(`Imported ${newSongs.length} song${newSongs.length === 1 ? "" : "s"}`, newSongs.map((s) => s.id));
          setShowImport(false);
        } else {
          setBulkText(text);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function addBulkSongs() {
    if (!bulkParsed.length) return;
    const newSongs = bulkParsed.map((s) => makeSongObj(s));
    updateActiveSongs((songs) => [...newSongs, ...songs]);
    recordAdd(`Imported ${newSongs.length} song${newSongs.length === 1 ? "" : "s"}`, newSongs.map((s) => s.id));
    setBulkText(""); setShowImport(false);
  }

  function updateSongField(id, key, value) { updateActiveSongs((songs) => songs.map((s) => (s.id === id ? { ...s, [key]: value } : s))); }
  function updateCategoryScore(id, catId, value) {
    const catMax = (activeList.categories || []).find((c) => c.id === catId)?.max || 100;
    updateActiveSongs((songs) => songs.map((s) => (s.id === id ? { ...s, categoryScores: { ...s.categoryScores, [catId]: value === "" ? null : Math.max(0, Math.min(catMax, Number(value))) } } : s)));
  }
  function setTierManual(id, value) { updateActiveSongs((songs) => songs.map((s) => (s.id === id ? { ...s, tier: value, tierLocked: true } : s))); }
  function resetTierToAuto(id) { updateActiveSongs((songs) => songs.map((s) => (s.id === id ? { ...s, tier: "", tierLocked: false } : s))); }
  function setManualRank(id, value) { updateActiveSongs((songs) => songs.map((s) => (s.id === id ? { ...s, lockedRank: Math.max(1, Number(value) || 1) } : s))); }
  function unlockRank(id) { updateSongField(id, "lockedRank", null); }
  function lockAtCurrentRank(id, rank) { updateSongField(id, "lockedRank", rank); }

  function addNote(songId) {
    const text = (noteDrafts[songId] || "").trim();
    if (!text || !username) return;
    updateActiveSongs((songs) => songs.map((s) => (s.id === songId ? { ...s, notes: [...(s.notes || []), { author: username, text, ts: Date.now() }] } : s)));
    setNoteDrafts({ ...noteDrafts, [songId]: "" });
  }
  function removeNote(songId, idx) { updateActiveSongs((songs) => songs.map((s) => (s.id === songId ? { ...s, notes: s.notes.filter((_, i) => i !== idx) } : s))); }
  function deleteSong(songId) { updateActiveSongs((songs) => songs.filter((s) => s.id !== songId)); }

  function addAward(songId, emojiOverride) {
    const draft = awardDrafts[songId] || {};
    const emoji = emojiOverride || draft.emoji || "🏆";
    const label = (draft.label || "").trim();
    updateActiveSongs((songs) => songs.map((s) => (s.id === songId ? { ...s, awards: [...(s.awards || []), { emoji, label, highlighted: false }] } : s)));
    setAwardDrafts({ ...awardDrafts, [songId]: { emoji: "🏆", label: "" } });
    setAwardPickerFor(null);
  }
  function removeAward(songId, idx) { updateActiveSongs((songs) => songs.map((s) => (s.id === songId ? { ...s, awards: s.awards.filter((_, i) => i !== idx) } : s))); }
  function toggleAwardHighlight(songId, idx) {
    updateActiveSongs((songs) => songs.map((s) => (s.id === songId ? { ...s, awards: s.awards.map((a, i) => (i === idx ? { ...a, highlighted: !a.highlighted } : a)) } : s)));
  }

  const artistsInList = useMemo(() => {
    const map = new Map();
    (activeList.songs || []).forEach((s) => map.set(s.artist, (map.get(s.artist) || 0) + 1));
    return Array.from(map.entries()).map(([artist, count]) => ({ artist, count })).sort((a, b) => a.artist.localeCompare(b.artist));
  }, [activeList]);
  function removeArtist(artist) { updateActiveSongs((songs) => songs.filter((s) => s.artist !== artist)); }

  const activeKeySet = useMemo(() => new Set((activeList.songs || []).map((s) => `${s.title}|${s.artist}`.toLowerCase())), [activeList]);
  function findExistingSong(title, artist) {
    return (activeList.songs || []).find((s) => s.title.toLowerCase() === title.toLowerCase() && s.artist.toLowerCase() === artist.toLowerCase());
  }

  // Known group ↔ member/subunit links, based only on artists actually present in the catalog.
  const GROUP_MEMBERS = {
    "BIGBANG": ["G-Dragon", "T.O.P"],
    "NewJeans": ["NJZ"],
    "NJZ": ["NewJeans"],
    "Twice": ["Nayeon", "Jihyo", "Tzuyu", "MISAMO"],
    "TXT": ["Yeonjun"],
    "SHINee": ["Taemin", "Onew", "Minho", "Jonghyun"],
    "Stray Kids": ["3RACHA"],
    "Red Velvet": ["Seulgi", "Wendy", "Joy", "Red Velvet - Irene & Seulgi"],
    "ASTRO": ["Cha Eun-woo", "Rocky", "MJ", "JuniGini", "Moonbin & Sanha", "Jinjin & Rocky"],
    "BTS": ["RM", "Jin", "Suga / Agust D", "J-Hope", "Jimin", "V", "Jung Kook"],
    "BLACKPINK": ["Jennie", "Jisoo", "Rosé", "Lisa"],
    "BTOB": ["Eunkwang", "Minhyuk / HUTA", "Changsub", "Hyunsik", "Peniel", "Sungjae"],
    "Brown Eyed Girls": ["JeA", "Miryo", "Narsha", "Gain"],
    "Day6": ["Young K", "Wonpil", "Sungjin", "Dowoon"],
    "EXO": ["Xiumin", "Suho", "Lay", "Baekhyun", "Chen", "Chanyeol", "D.O.", "Kai", "Sehun", "EXO-CBX", "EXO-SC"],
    "f(x)": ["Amber", "Luna"],
    "GOT7": ["Mark Tuan", "Jackson Wang", "Jinyoung", "Youngjae", "BamBam", "Yugyeom", "Jay B", "JJ Project", "Jus2"],
    "I.O.I": ["Kim Sejeong", "Jeon Somi", "Chung Ha"],
    "IZONE": ["Kwon Eunbi", "Choi Ye-na", "Jo Yu-ri", "Lee Chaeyeon"],
    "ITZY": ["Yeji", "Lia", "Ryujin", "Chaeryeong", "Yuna"],
    "IVE": ["Wonyoung", "Rei", "Liz", "Gaeul", "Leeseo", "Yujin"],
    "iKON": ["Bobby", "MOBB"],
    "LE SSERAFIM": ["Yunjin", "Sakura"],
    "LOONA": ["LOONA 1/3", "Odd Eye Circle", "LOONA yyxy", "Chuu", "Yves", "ARTMS", "Loossemble"],
    "NCT": ["NCT 127", "NCT DREAM", "NCT Wish", "WayV", "Mark", "Haechan", "Renjun & Chenle", "Taeyong", "Doyoung", "Jaehyun", "Yuta", "Ten", "Kun & Xiaojun", "Jungwoo"],
    "Super Junior": ["Kyuhyun", "Ryeowook", "Yesung", "Henry", "Zhoumi", "Sungmin", "SuperM", "Super Junior-83z", "Super Junior-D&E"],
    "Seventeen": ["BSS", "JxW", "V8", "Hoshi", "Woozi", "The8", "Jun", "Vernon", "Dino"],
    "S.E.S.": ["Bada", "Eugene"],
    "Shinhwa": ["Lee Min Woo", "Shin Hye Sung", "Jun Jin", "Andy", "Kim Dong Wan"],
    "T-ARA": ["T-ARA N4", "QBS", "Jiyeon", "Hyomin", "Eunjung"],
    "SISTAR": ["SISTAR19", "Hyolyn", "Soyou", "Dasom"],
    "VIXX": ["VIXX LR", "Leo", "Ken", "Ravi"],
    "Pentagon": ["Triple H", "Kino", "Hui", "Wooseok", "Jinho"],
    "ONEUS": ["Leedo & Xion", "Seoho"],
    "ONEWE": ["Giuk"],
    "OnlyOneOf": ["YooJung", "KB"],
    "Pristin": ["PRISTIN V"],
    "SPICA": ["SPICA.S", "Kim Boa"],
    "Secret": ["Song Ji Eun", "Jun Hyo Seong"],
    "Pink Fantasy": ["Pink Fantasy SHY", "Pink Fantasy MDD", "Yechan"],
    "U-KISS": ["Soohyun", "Hoon"],
    "WJSN": ["WJSN Chocome", "WJSN The Black", "SeolA", "Yeonjung", "Dawon (WJSN)"],
    "SF9": ["Zuho", "Chani", "Dawon (SF9)"],
    "WANNAONE": ["Yoon Ji-sung", "Ha Sung-woon", "Hwang Min-hyun", "Ong Seong-wu", "Kim Jae-hwan", "Kang Daniel", "Park Ji-hoon", "Park Woo-jin", "Bae Jin-young", "Lee Dae-hwi", "Lai Kuan-lin"],
    "Purple Kiss": ["Swan"],
    "f(x)": ["Amber", "Luna"],
    "GOT7": ["Mark Tuan", "Jackson Wang", "Jinyoung", "Youngjae", "BamBam", "Yugyeom", "Jay B", "JJ Project", "Jus2"],
    "I.O.I": ["Kim Sejeong", "Jeon Somi", "Chung Ha"],
    "IZONE": ["Kwon Eunbi", "Choi Ye-na", "Jo Yu-ri", "Lee Chaeyeon"],
    "ITZY": ["Yeji", "Lia", "Ryujin", "Chaeryeong", "Yuna"],
    "IVE": ["Wonyoung", "Rei", "Liz", "Gaeul", "Leeseo", "Yujin"],
    "iKON": ["Bobby", "MOBB"],
    "LE SSERAFIM": ["Yunjin", "Sakura"],
    "LOONA": ["LOONA 1/3", "Odd Eye Circle", "LOONA yyxy", "Chuu", "Yves", "ARTMS", "Loossemble"],
  };
  function familyFor(query) {
    for (const [group, members] of Object.entries(GROUP_MEMBERS)) {
      if (group.toLowerCase() === query || members.some((m) => m.toLowerCase() === query)) {
        return new Set([group, ...members]);
      }
    }
    return null;
  }

  const catalogResults = useMemo(() => {
    const q = rankQuery.trim().toLowerCase();
    if (!q) return { artists: [], albums: [], songs: [] };
    let matches = SEED_SONGS.filter(([t, a, al]) =>
      (searchIn.song && t.toLowerCase().includes(q)) || (searchIn.artist && a.toLowerCase().includes(q)) || (searchIn.album && (al || "").toLowerCase().includes(q))
    );
    if (searchIn.artist) {
      const family = familyFor(q);
      if (family) {
        const already = new Set(matches.map(([t, a]) => `${t}|${a}`));
        const extra = SEED_SONGS.filter(([t, a]) => family.has(a) && !already.has(`${t}|${a}`));
        matches = [...matches, ...extra];
      }
    }
    const albumMap = new Map(), artistMap = new Map();
    matches.forEach(([t, a, al, y]) => {
      if (al) {
        const key = `${al}|${a}`;
        if (!albumMap.has(key)) albumMap.set(key, { album: al, artist: a, year: y, songs: [] });
        albumMap.get(key).songs.push([t, a, al, y]);
        if (y && (!albumMap.get(key).year || y > albumMap.get(key).year)) albumMap.get(key).year = y;
      }
      if (!artistMap.has(a)) artistMap.set(a, { artist: a, songs: [], year: y });
      artistMap.get(a).songs.push([t, a, al, y]);
      if (y && (!artistMap.get(a).year || y > artistMap.get(a).year)) artistMap.get(a).year = y;
    });
    const dir = sortBy === "asc" ? 1 : -1;
    return {
      artists: Array.from(artistMap.values()).sort((x, y) => dir * ((x.year || 0) - (y.year || 0))).slice(0, 8),
      albums: Array.from(albumMap.values()).sort((x, y) => dir * ((x.year || 0) - (y.year || 0))).slice(0, 12),
      songs: [...matches].sort((x, y) => dir * ((x[3] || 0) - (y[3] || 0))).slice(0, 40),
    };
  }, [rankQuery, searchIn, sortBy]);

  // Adding always routes through a confirm overlay (fast) or a step-through review (detailed)
  // instead of landing directly in the list. The search modal closes first so only one
  // dimmed overlay is ever visible at once.
  function triggerAdd(items, label) {
    const filtered = items.filter(([t, a]) => !activeKeySet.has(`${t}|${a}`.toLowerCase()));
    if (!filtered.length) return;
    setShowRank(false);
    if (filtered.length > 12) { setPendingBigAdd(filtered); setPendingBigAddLabel(label); setShowBigAddConfirm(true); return; }
    proceedAdd(filtered, label);
  }
  function proceedAdd(filtered, label) {
    if (rankMode === "detailed") {
      setReviewExisting(false);
      setReviewQueue(filtered); setReviewIndex(0);
      setReviewDraft({ score: "", tier: "", bgImage: "", categoryScores: {}, awardEmoji: "", awardLabel: "", note: "" });
      setShowReview(true);
    } else {
      const checked = {};
      filtered.forEach(([t, a]) => (checked[`${t}|${a}`] = true));
      setAddConfirmItems(filtered); setAddConfirmChecked(checked); setAddConfirmLabel(label); setAddConfirmBg(""); setShowAddConfirm(true);
    }
  }
  function confirmBigAdd() { proceedAdd(pendingBigAdd, pendingBigAddLabel); setShowBigAddConfirm(false); setPendingBigAdd([]); setPendingBigAddLabel(""); }

  function commitAddConfirm() {
    const toAdd = addConfirmItems.filter(([t, a]) => addConfirmChecked[`${t}|${a}`]);
    if (!toAdd.length) { setShowAddConfirm(false); return; }
    const newSongs = toAdd.map(([title, artist, album, year]) => makeSongObj({ title, artist, album, year, bgImage: addConfirmBg.trim() }));
    updateActiveSongs((songs) => [...newSongs, ...songs]);
    recordAdd(addConfirmLabel || `${newSongs.length} songs`, newSongs.map((s) => s.id));
    setShowAddConfirm(false);
  }

  function openUnrankedReview() {
    const unranked = activeList.songs.filter((s) => effectiveScore(activeList, s) == null);
    if (!unranked.length) return;
    setReviewExisting(true);
    setReviewQueue(unranked.map((s) => s.id));
    setReviewIndex(0);
    setReviewDraft({ score: "", tier: "", bgImage: "", categoryScores: {}, awardEmoji: "", awardLabel: "", note: "" });
    setShowReview(true);
  }

  function reviewCommit(unranked) {
    if (reviewExisting) {
      const songId = reviewQueue[reviewIndex];
      updateActiveSongs((songs) => songs.map((s) => {
        if (s.id !== songId) return s;
        const updated = { ...s };
        if (!unranked) {
          if (activeList.advancedMode) updated.categoryScores = { ...s.categoryScores, ...reviewDraft.categoryScores };
          else updated.score = reviewDraft.score === "" ? null : Math.min(scoreScale, Number(reviewDraft.score));
        }
        if (reviewDraft.tier) { updated.tier = reviewDraft.tier; updated.tierLocked = true; }
        if (reviewDraft.bgImage) updated.bgImage = reviewDraft.bgImage;
        if (reviewDraft.awardEmoji) updated.awards = [...(s.awards || []), { emoji: reviewDraft.awardEmoji, label: reviewDraft.awardLabel || "" }];
        if (reviewDraft.note.trim() && username) updated.notes = [...(s.notes || []), { author: username, text: reviewDraft.note.trim(), ts: Date.now() }];
        return updated;
      }));
    } else {
      const [title, artist, album, year] = reviewQueue[reviewIndex];
      const song = makeSongObj({
        title, artist, album, year,
        score: unranked || activeList.advancedMode ? null : (reviewDraft.score === "" ? null : Math.min(scoreScale, Number(reviewDraft.score))),
        tier: reviewDraft.tier, bgImage: reviewDraft.bgImage,
        categoryScores: !unranked && activeList.advancedMode ? { ...reviewDraft.categoryScores } : {},
        awards: reviewDraft.awardEmoji ? [{ emoji: reviewDraft.awardEmoji, label: reviewDraft.awardLabel || "" }] : [],
        notes: reviewDraft.note.trim() && username ? [{ author: username, text: reviewDraft.note.trim(), ts: Date.now() }] : [],
      });
      updateActiveSongs((songs) => [song, ...songs]);
      recordAdd(`${song.title} — ${song.artist}`, [song.id]);
    }
    advanceReview();
  }
  function reviewSkip() { advanceReview(); }
  function skipRestOfReview() { setShowReview(false); setReviewQueue([]); setReviewIndex(0); setReviewExisting(false); }
  function jumpReviewTo(idx) {
    setReviewIndex(idx);
    setReviewDraft({ score: "", tier: "", bgImage: "", categoryScores: {}, awardEmoji: "", awardLabel: "", note: "" });
    setReviewAwardPicker(false);
  }
  function advanceReview() {
    if (reviewIndex + 1 >= reviewQueue.length) { setShowReview(false); setReviewQueue([]); setReviewIndex(0); setReviewExisting(false); }
    else { setReviewIndex(reviewIndex + 1); setReviewDraft({ score: "", tier: "", bgImage: "", categoryScores: {}, awardEmoji: "", awardLabel: "", note: "" }); setReviewAwardPicker(false); }
  }

  function jumpToSong(songId) {
    setShowRank(false); setSearch(""); setViewMode("list");
    setExpandedId(songId);
    setTimeout(() => {
      const el = document.getElementById(`song-row-${songId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }

  function addCategory() {
    if ((activeList.categories || []).length >= 8) return;
    const newCats = [...(activeList.categories || DEFAULT_CATEGORIES()), { id: `cat-${Date.now().toString(36)}`, name: "New category", weight: 50, max: 100 }];
    const patch = { categories: newCats };
    if (activeList.advancedScoreMode === "sum") patch.scoreScale = newCats.reduce((sum, c) => sum + (Number(c.max) || 100), 0);
    updateActiveList(patch);
  }
  function removeCategory(id) {
    const cats = (activeList.categories || []).filter((c) => c.id !== id);
    const finalCats = cats.length ? cats : DEFAULT_CATEGORIES();
    const patch = { categories: finalCats };
    if (activeList.advancedScoreMode === "sum") patch.scoreScale = finalCats.reduce((sum, c) => sum + (Number(c.max) || 100), 0);
    updateActiveList(patch);
  }
  function updateCategory(id, patch) {
    const newCats = (activeList.categories || []).map((c) => (c.id === id ? { ...c, ...patch } : c));
    const listPatch = { categories: newCats };
    if (activeList.advancedScoreMode === "sum") listPatch.scoreScale = newCats.reduce((sum, c) => sum + (Number(c.max) || 100), 0);
    updateActiveList(listPatch);
  }
  function addTierName() {
    if ((activeList.tierNames || []).length >= 20) return;
    updateActiveList({ tierNames: [...(activeList.tierNames || []), { id: `tier-${Date.now().toString(36)}`, name: "New Tier", color: TIER_PALETTE[(activeList.tierNames || []).length % TIER_PALETTE.length] }] });
  }
  function updateTier(id, patch) { updateActiveList({ tierNames: (activeList.tierNames || []).map((t) => (t.id === id ? { ...t, ...patch } : t)) }); }
  function removeTier(id) { updateActiveList({ tierNames: (activeList.tierNames || []).filter((t) => t.id !== id) }); }
  function reorderTier(fromIdx, toIdx) {
    const arr = [...(activeList.tierNames || [])];
    const [moved] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, moved);
    updateActiveList({ tierNames: arr });
  }
  function addAutoRule() {
    const s = Number(newRuleScore), t = newRuleTier.trim();
    if (isNaN(s) || !t) return;
    updateActiveList({ autoTierRules: [...(activeList.autoTierRules || []), { id: `rule-${Date.now().toString(36)}`, minScore: s, tierName: t }] });
    setNewRuleScore(""); setNewRuleTier("");
  }
  function removeAutoRule(id) { updateActiveList({ autoTierRules: (activeList.autoTierRules || []).filter((r) => r.id !== id) }); }
  function addColorStop() {
    if ((activeList.scoreColorStops || []).length >= 5) return;
    updateActiveList({ scoreColorStops: [...(activeList.scoreColorStops || []), { id: `stop-${Date.now().toString(36)}`, score: 0, color: "#FFC857" }] });
  }
  function updateColorStop(id, patch) { updateActiveList({ scoreColorStops: (activeList.scoreColorStops || []).map((s) => (s.id === id ? { ...s, ...patch } : s)) }); }
  function removeColorStop(id) { updateActiveList({ scoreColorStops: (activeList.scoreColorStops || []).filter((s) => s.id !== id) }); }

  const ranked = useMemo(() => computeRanks(activeList).sort((a, b) => a.rank - b.rank || b.createdAt - a.createdAt), [activeList]);
  const [filterAwardsOnly, setFilterAwardsOnly] = useState(false);
  const visibleRanked = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = ranked;
    if (q) arr = arr.filter((s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q) || (s.album || "").toLowerCase().includes(q));
    if (filterAwardsOnly) arr = arr.filter((s) => (s.awards || []).length > 0);
    return arr;
  }, [ranked, search, filterAwardsOnly]);
  const hasUnranked = useMemo(() => activeList.songs.some((s) => effectiveScore(activeList, s) == null), [activeList]);

  useEffect(() => {
    if (!activeList.autoArtistImages) return;
    const uniqueArtists = Array.from(new Set((activeList.songs || []).map((s) => s.artist).filter(Boolean)));
    uniqueArtists.forEach((artist) => {
      if (artistImages[artist] || artistImageFetching.current.has(artist)) return;
      const cacheKey = `artistImg:${artist.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setArtistImages((prev) => ({ ...prev, [artist]: cached }));
        return;
      }
      artistImageFetching.current.add(artist);
      const saveImage = (url) => {
        localStorage.setItem(cacheKey, url);
        setArtistImages((prev) => ({ ...prev, [artist]: url }));
      };
      const fallbackToItunes = () => {
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(artist)}&entity=song&limit=1`)
          .then((res) => res.json())
          .then((data) => {
            const art = data?.results?.[0]?.artworkUrl100;
            if (art) saveImage(art.replace("100x100", "300x300"));
          })
          .catch(() => {})
          .finally(() => artistImageFetching.current.delete(artist));
      };
      // Try Wikipedia first — usually a real group/artist photo rather than album art.
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist.replace(/ /g, "_"))}`)
        .then((res) => {
          if (!res.ok) throw new Error("not found");
          return res.json();
        })
        .then((data) => {
          if (data.type === "disambiguation") throw new Error("ambiguous");
          const thumb = data?.thumbnail?.source;
          if (thumb) {
            saveImage(thumb);
            artistImageFetching.current.delete(artist);
          } else {
            fallbackToItunes();
          }
        })
        .catch(() => fallbackToItunes());
    });
  }, [activeList.autoArtistImages, activeList.songs, artistImages]);

  if (loading) return <div style={{ background: theme.background, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: MUTED, fontFamily: "Inter, sans-serif" }}>Loading…</div></div>;

  return (
    <div style={{ background: theme.background, minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: TEXT }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap');
        .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em; }
        .kp-input { background: #26223A; border: 1px solid ${BORDER}; color: ${TEXT}; border-radius: 8px; padding: 10px 12px; font-family: 'Inter', sans-serif; font-size: 14px; width: 100%; outline: none; }
        .kp-input:focus { border-color: ${theme.accent}; }
        .kp-input::placeholder { color: ${MUTED}; }
        .kp-btn { background: ${theme.accent}; color: #14121F; border: none; border-radius: 8px; padding: 10px 16px; font-weight: 700; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: transform 0.12s ease; }
        .kp-btn:hover { transform: translateY(-1px); }
        .kp-btn:disabled { opacity: 0.4; cursor: default; transform: none; }
        .kp-btn-bright { background: ${theme.highlight}; color: #14121F; border: none; border-radius: 8px; padding: 7px 12px; font-weight: 700; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; }
        .kp-btn-bright:disabled { opacity: 0.35; cursor: default; }
        .kp-btn-ghost { background: transparent; color: ${MUTED}; border: 1px solid ${BORDER}; border-radius: 8px; padding: 9px 14px; font-size: 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .kp-btn-ghost:hover { border-color: ${theme.secondary}; color: ${TEXT}; }
        .expand-btn { display: inline-flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; border: 1px solid ${BORDER}; border-radius: 8px; background: transparent; color: ${MUTED}; cursor: pointer; padding: 9px; max-width: 40px; transition: max-width .28s ease, padding .28s ease, color .2s, border-color .2s; }
        .expand-btn:hover { max-width: 180px; padding: 9px 14px; border-color: ${theme.secondary}; color: ${TEXT}; }
        .expand-btn .label { opacity: 0; transition: opacity .15s ease .05s; }
        .expand-btn:hover .label { opacity: 1; }
        .icon-btn { background: transparent; border: 1px solid ${BORDER}; border-radius: 8px; color: ${MUTED}; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .icon-btn:hover { color: ${TEXT}; border-color: ${theme.secondary}; }
        .icon-btn-tall { height: 42px; padding: 0 12px; width: auto; }
        .rank-cell { display: flex; align-items: center; gap: 1px; }
        .rank-lock-toggle { cursor: pointer; flex-shrink: 0; opacity: 0; transition: opacity .15s ease; }
        .rank-cell:hover .rank-lock-toggle.reveal { opacity: 1; }
        .rank-lock-toggle.locked { opacity: 1; }
        .rank-input { background: transparent; border: 1px solid transparent; border-radius: 6px; font-weight: 700; font-size: 18px; width: 32px; padding: 2px; text-align: center; font-family: 'Bebas Neue', sans-serif; }
        .rank-input:hover, .rank-input:focus { border-color: ${BORDER}; outline: none; }
        .score-input { background: transparent; border: 1px solid transparent; border-radius: 6px; font-weight: 700; font-size: 14px; width: 60px; padding: 2px; text-align: center; font-family: 'Inter', sans-serif; display: block; margin: 0 auto; }
        .score-input:hover, .score-input:focus { border-color: ${BORDER}; outline: none; }
        .tier-input { background: #26223A; border: 1px solid ${BORDER}; border-radius: 6px; font-weight: 700; font-size: 10.5px; width: 60px; padding: 2px; text-align: center; font-family: 'Inter', sans-serif; display: block; margin: 0 auto; }
        .review-jump { background: transparent; border: none; color: ${MUTED}; font-size: 13px; font-weight: 600; padding: 0; cursor: pointer; outline: none; width: 100%; }
        .review-jump:hover, .review-jump:focus { color: ${TEXT}; }
        .review-title-select { background: #26223A; border: 1px solid transparent; border-radius: 6px; color: ${TEXT}; font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.02em; font-size: 24px; padding: 4px 6px; cursor: pointer; outline: none; width: 100%; appearance: auto; margin-bottom: 16px; }
        .review-title-select option { background: #26223A; color: ${TEXT}; }
        input[type="color"] { -webkit-appearance: none; appearance: none; width: 30px; height: 30px; border: none; border-radius: 50%; cursor: pointer; background: none; padding: 0; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; border-radius: 50%; }
        input[type="color"]::-webkit-color-swatch { border: 2px solid ${BORDER}; border-radius: 50%; }
        .kp-row-wrap { position: relative; border-radius: 10px; margin-bottom: 6px; overflow: visible; isolation: isolate; }
        .kp-row-bg { position: absolute; inset: 0; border-radius: 10px; overflow: hidden; z-index: 0; }
        .kp-row-bg img { width: 100%; height: 100%; object-fit: cover; }
        .kp-row-bg .dim { position: absolute; inset: 0; background: rgba(0,0,0,0.6); }
        .kp-row { position: relative; z-index: 1; display: grid; grid-template-columns: 44px 1.4fr 1fr 46px 56px minmax(60px, auto) 26px 30px; gap: 8px; align-items: center; }
        @media (max-width: 760px) {
          .kp-row { grid-template-columns: 34px 1fr 40px 50px minmax(44px, auto) 22px 22px; }
          .col-album { display: none; }
          .kp-grid-2 { grid-template-columns: 1fr !important; }
        }
        .award-badge { background: none; border: 1px solid transparent; border-radius: 6px; font-size: 14px; padding: 2px 3px; cursor: pointer; line-height: 1; }
        .award-badge:hover { background: #35304D; }
        .award-badge.highlighted { background: rgba(255, 201, 87, 0.18); border-color: ${GOLD}; box-shadow: 0 0 0 1px ${GOLD} inset; }
        .result-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid ${BORDER}; gap: 10px; }
        .mode-toggle { display: inline-flex; border: 1px solid ${BORDER}; border-radius: 8px; overflow: hidden; }
        .mode-toggle button { padding: 8px 14px; font-size: 13px; border: none; cursor: pointer; background: transparent; color: ${MUTED}; }
        .mode-toggle button.active { background: ${theme.accent}; color: #14121F; font-weight: 700; }
        .emoji-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; background: ${CARD}; border: 1px solid ${BORDER}; border-radius: 10px; padding: 8px; position: absolute; z-index: 500; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
        .emoji-grid button { background: none; border: none; font-size: 18px; padding: 5px; cursor: pointer; border-radius: 6px; }
        .emoji-grid button:hover { background: #35304D; }
        .avatar { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid ${BORDER}; cursor: pointer; }
        .avatar-placeholder { width: 30px; height: 30px; border-radius: 50%; background: #26223A; border: 1px solid ${BORDER}; display: flex; align-items: center; justify-content: center; cursor: pointer; color: ${MUTED}; font-size: 12px; font-weight: 700; }
        .tier-chip { display: flex; align-items: center; gap: 6px; background: #26223A; border-radius: 6px; padding: 4px 6px; cursor: grab; }
        .gallery-grid { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-start; }
        .gallery-card { position: relative; border-radius: 14px; overflow: hidden; aspect-ratio: 3 / 4; background: ${CARD}; cursor: pointer; border: 1px solid ${BORDER}; flex-shrink: 0; }
        .gallery-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .gallery-dim { position: absolute; inset: 0; background: rgba(0,0,0,0.6); }
        .gallery-artist { position: absolute; top: 8px; left: 6px; right: 6px; text-align: center; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
        .gallery-title { position: absolute; top: 50%; left: 6px; right: 6px; transform: translateY(-50%); text-align: center; font-family: 'Bebas Neue', sans-serif; line-height: 1.05; }
        .gallery-rank { position: absolute; bottom: 8px; left: 8px; font-family: 'Bebas Neue', sans-serif; line-height: 1; }
        .gallery-score { position: absolute; bottom: 8px; left: 8px; font-weight: 700; }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 20px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, gap: 16 }}>
          <div>
            <h1 className="display" style={{ fontSize: 46, margin: 0, lineHeight: 1 }}>
              <span style={{ color: theme.accent }}>KPOP</span><span style={{ color: TEXT }}>RANKER</span>
            </h1>
            <div style={{ fontSize: 10.5, color: MUTED, marginTop: 4 }}>Catalog last updated: {CATALOG_LAST_UPDATED}</div>
            <div style={{ fontSize: 10.5, color: MUTED }}>App last updated: {APP_LAST_UPDATED}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings"><Settings size={16} /></button>
              {avatarUrl && !avatarBroken ? (
                <img src={avatarUrl} alt="" className="avatar" referrerPolicy="no-referrer" onError={() => setAvatarBroken(true)} onClick={() => { setAvatarDraft(avatarUrl); setShowAvatarModal(true); }} />
              ) : (
                <div className="avatar-placeholder" onClick={() => { setAvatarDraft(avatarUrl); setShowAvatarModal(true); }}>{username ? username[0].toUpperCase() : <UserCircle size={16} />}</div>
              )}
            </div>
            {username && (editingName ? (
              <div style={{ display: "flex", gap: 4 }}>
                <input className="kp-input" style={{ width: 110, padding: "5px 8px", fontSize: 12 }} value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmName()} autoFocus />
                <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={confirmName}><Check size={13} /></button>
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: MUTED, display: "flex", alignItems: "center", gap: 5 }}>
                signed in as <span style={{ color: theme.secondary, fontWeight: 600 }}>{username}</span>
                <Pencil size={11} style={{ cursor: "pointer" }} onClick={() => { setNameInput(username); setEditingName(true); }} />
              </div>
            ))}
          </div>
        </div>

        {!username ? (
          <div style={{ background: CARD, borderRadius: 12, padding: 20, marginBottom: 24, border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 14, color: MUTED, marginBottom: 10 }}>What should we call you?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="kp-input" placeholder="your name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && confirmName()} />
              <button className="kp-btn" onClick={confirmName}>Join</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: "relative", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setListDropdownOpen(!listDropdownOpen)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: 0 }}>
                <span className="display" style={{ fontSize: 24, color: TEXT }}>{activeList.name}</span>
                <ChevronDown size={16} color={MUTED} />
              </button>
              <button className="icon-btn" title="List options" onClick={() => setShowListOptions(true)}><Wrench size={14} /></button>
              {listDropdownOpen && (
                <div style={{ position: "absolute", top: "110%", left: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, zIndex: 30, minWidth: 240, overflow: "hidden" }}>
                  {lists.map((l) => (
                    <div key={l.id} onClick={() => switchList(l.id)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid ${BORDER}`, background: l.id === activeListId ? "#26223A" : "transparent" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: TEXT }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{l.songs.length} songs{l.tags?.length ? ` · ${l.tags.join(", ")}` : ""}</div>
                    </div>
                  ))}
                  <div onClick={() => { setListDropdownOpen(false); setShowNewList(true); }} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: theme.secondary, fontSize: 13 }}>
                    <FolderPlus size={13} /> Add a new list
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="kp-btn" onClick={() => setShowRank(true)}><Search size={16} /> Rank</button>
                {rankMode === "detailed" && (
                  <button className="kp-btn-ghost" style={{ color: theme.accent, borderColor: theme.accent, opacity: hasUnranked ? 1 : 0.4 }} disabled={!hasUnranked} onClick={openUnrankedReview}>
                    <ListChecks size={14} /> Unranked
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="expand-btn" onClick={() => setShowAdd(true)}><Plus size={16} color={MUTED} style={{ flexShrink: 0 }} /><span className="label">Add Song</span></button>
                <button className="expand-btn" onClick={() => setShowImport(true)}><Music size={16} color={MUTED} style={{ flexShrink: 0 }} /><span className="label">Import List</span></button>
                <button className="expand-btn" onClick={() => { setConfirmArtist(null); setShowRemove(true); }}><Trash2 size={16} color={MUTED} style={{ flexShrink: 0 }} /><span className="label">Remove</span></button>
              </div>
            </div>

            {activeList.songs.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <input className="kp-input" placeholder="Search this list…" value={search} onChange={(e) => setSearch(e.target.value)} />
                <button className={`icon-btn icon-btn-tall ${filterAwardsOnly ? "active" : ""}`} style={filterAwardsOnly ? { color: theme.accent, borderColor: theme.accent } : {}} title="Show only songs with awards" onClick={() => setFilterAwardsOnly(!filterAwardsOnly)}><Award size={15} /></button>
                <button className="icon-btn icon-btn-tall" title="Toggle view" onClick={() => saveViewMode(viewMode === "list" ? "gallery" : "list")}>
                  {viewMode === "list" ? <List size={15} /> : <LayoutGrid size={15} />}
                </button>
              </div>
            )}
          </>
        )}

        {error && <div style={{ color: theme.accent, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        {username && activeList.songs.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: MUTED }}>
            <Music size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
            <div>This list is empty. Hit <strong style={{ color: theme.secondary }}>Rank</strong> to search and add songs.</div>
          </div>
        )}

        {username && activeList.songs.length > 0 && visibleRanked.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: MUTED }}>No songs match "{search}".</div>
        )}

        {/* GALLERY VIEW */}
        {username && visibleRanked.length > 0 && viewMode === "gallery" && (
          <div className="gallery-grid">
            {visibleRanked.map((song) => {
              const size = cardSizeFor(song.rank);
              const dims = CARD_DIMS[size];
              const score = song._score;
              const rankColor = song.rank === 1 ? GOLD : song.rank === 2 ? SILVER : song.rank === 3 ? BRONZE : theme.highlight;
              return (
                <div key={song.id} className="gallery-card" style={{ width: dims.width }} onClick={() => jumpToSong(song.id)}>
                  <BgImg src={song.bgImage} />
                  <div className="gallery-dim" />
                  <div className="gallery-artist" style={{ color: theme.secondary, fontSize: dims.artist }}>{song.artist}</div>
                  <div className="gallery-title" style={{ color: TEXT, fontSize: dims.title }}>{song.title}</div>
                  <div className="gallery-rank" style={{ color: rankColor, fontSize: dims.rank }}>{song.rank}</div>
                  <div className="gallery-score" style={{ color: theme.highlight, fontSize: dims.score, bottom: 8 + dims.rank * 0.7 }}>{score != null ? score : "—"}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {username && visibleRanked.length > 0 && viewMode === "list" && (
          <div>
            <div className="kp-row" style={{ padding: "0 14px 8px", fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Rank</span><span>Song / Artist</span><span className="col-album">Album</span>
              <span style={{ textAlign: "center" }}>{activeList.showScore ? "Score" : ""}</span>
              <span style={{ textAlign: "center" }}>{activeList.showTier ? "Tier" : ""}</span>
              <span style={{ textAlign: "center" }}>Awards</span>
              <span></span><span></span>
            </div>
            {visibleRanked.map((song, idx) => {
              const isExpanded = expandedId === song.id;
              const draft = awardDrafts[song.id] || { emoji: "🏆", label: "" };
              const score = song._score;
              const tierVal = displayTier(activeList, song, score);
              const scoreColor = getScoreColor(activeList, score, theme.highlight);
              const rankColor = song.rank === 1 ? GOLD : song.rank === 2 ? SILVER : song.rank === 3 ? BRONZE : song.isLocked ? theme.secondary : MUTED;
              const breakdown = activeList.advancedMode
                ? (activeList.categories || DEFAULT_CATEGORIES()).map((c) => `${c.name}: ${song.categoryScores?.[c.id] ?? "—"}`).join("\n")
                : undefined;
              return (
                <div key={song.id} id={`song-row-${song.id}`} className="kp-row-wrap" style={{ background: song.bgImage ? "transparent" : idx % 2 === 0 ? CARD : ROW_ALT }}>
                  {song.bgImage && <div className="kp-row-bg"><BgImg src={song.bgImage} /><div className="dim" /></div>}
                  <div className="kp-row" style={{ padding: "12px 14px" }}>
                    <div className="rank-cell">
                      <Lock size={11} color={rankColor} className={`rank-lock-toggle ${song.isLocked ? "locked" : "reveal"}`}
                        onClick={() => (song.isLocked ? unlockRank(song.id) : lockAtCurrentRank(song.id, song.rank))} />
                      <input className="rank-input" style={{ color: rankColor }} type="number" min={1} value={song.rank} onChange={(e) => setManualRank(song.id, e.target.value)} />
                    </div>
                    <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      {activeList.autoArtistImages && (
                        artistImages[song.artist] ? (
                          <img src={artistImages[song.artist]} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `1px solid ${BORDER}` }} />
                        ) : (
                          <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: "#26223A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: MUTED, fontWeight: 700 }}>
                            {song.artist ? song.artist[0].toUpperCase() : "?"}
                          </div>
                        )
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {song.title}
                        </div>
                        <div style={{ fontSize: 12, color: theme.secondary, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{song.artist}</div>
                      </div>
                    </div>
                    <span className="col-album" style={{ fontSize: 12.5, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {song.album || "—"}{song.year ? ` · ${song.year}` : ""}
                    </span>
                    <div style={{ textAlign: "center" }}>
                      {activeList.showScore && (
                        activeList.advancedMode ? (
                          <span className="score-input" title={breakdown} style={{ cursor: "help", color: scoreColor }}>{score != null ? score : "—"}</span>
                        ) : (
                          <input className="score-input" style={{ color: scoreColor }} type="number" max={scoreScale} value={song.score ?? ""} placeholder="—"
                            onChange={(e) => updateSongField(song.id, "score", e.target.value === "" ? null : Math.min(scoreScale, Number(e.target.value)))} />
                        )
                      )}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {activeList.showTier && (
                        activeList.tierNames?.length ? (
                          <select className="tier-input" style={{ color: tierColorFor(activeList, tierVal) }} value={tierVal === "NULL" ? "" : tierVal} onChange={(e) => setTierManual(song.id, e.target.value)}>
                            <option value="">—</option>
                            {activeList.tierNames.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                          </select>
                        ) : (
                          <input className="tier-input" style={{ background: "transparent", border: "1px solid transparent" }} value={tierVal === "NULL" ? "" : tierVal} placeholder="—" onChange={(e) => setTierManual(song.id, e.target.value)} />
                        )
                      )}
                    </div>
                    <div className="awards-cell" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 3 }}>
                      {(song.awards || []).map((a, i) => (
                        <button key={i} type="button" className={`award-badge${a.highlighted ? " highlighted" : ""}`} title={a.label || ""}
                          onClick={() => toggleAwardHighlight(song.id, i)}>{a.emoji}</button>
                      ))}
                    </div>
                    <button className="icon-btn" style={{ width: 24, height: 24, border: "none", position: "relative" }} title="Notes" onClick={() => setNotePopoverFor(notePopoverFor === song.id ? null : song.id)}>
                      <StickyNote size={14} color={(song.notes || []).length ? theme.secondary : MUTED} />
                    </button>
                    <button className="kp-btn-ghost" style={{ padding: 6, border: "none" }} onClick={() => setExpandedId(isExpanded ? null : song.id)}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {notePopoverFor === song.id && (
                    <div style={{ padding: "0 16px 12px", position: "relative", zIndex: 1 }}>
                      {(song.notes || []).length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
                          {song.notes.map((n, i) => (
                            <div key={i} style={{ fontSize: 12, background: "#26223A", borderRadius: 6, padding: "6px 8px" }}>
                              <div style={{ color: TEXT }}>{n.text}</div>
                              <div style={{ color: MUTED, fontSize: 10, marginTop: 2, display: "flex", justifyContent: "space-between" }}>
                                <span>{n.author} · {timeAgo(n.ts)}</span><X size={11} style={{ cursor: "pointer" }} onClick={() => removeNote(song.id, i)} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 6 }}>
                        <input className="kp-input" placeholder="Add a note…" style={{ fontSize: 12.5, padding: "6px 10px" }} value={noteDrafts[song.id] || ""}
                          onChange={(e) => setNoteDrafts({ ...noteDrafts, [song.id]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addNote(song.id)} />
                        <button className="kp-btn-ghost" style={{ padding: "6px 10px" }} onClick={() => addNote(song.id)}><StickyNote size={12} /></button>
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${BORDER}`, position: "relative", zIndex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0 0" }}>
                        {username === song.addedBy && <Trash2 size={14} style={{ cursor: "pointer", color: MUTED }} title="Delete song" onClick={() => deleteSong(song.id)} />}
                      </div>
                      <div style={{ fontSize: 11, color: MUTED, margin: "6px 0 10px" }}>{song.album || "Unknown album"}{song.year ? ` · ${song.year}` : ""}</div>

                      {activeList.advancedMode && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, color: MUTED, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Category scores (out of 100)</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            {(activeList.categories || DEFAULT_CATEGORIES()).map((c) => (
                              <div key={c.id} style={{ textAlign: "center" }}>
                                <input className="kp-input" type="number" min={0} max={c.max || 100} style={{ width: 60, padding: "6px", textAlign: "center" }} value={song.categoryScores?.[c.id] ?? ""} placeholder="—" onChange={(e) => updateCategoryScore(song.id, c.id, e.target.value)} />
                                <div style={{ fontSize: 10.5, color: MUTED, marginTop: 3 }}>{c.name}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeList.autoTier && song.tierLocked && (
                        <button className="kp-btn-ghost" style={{ padding: "4px 8px", fontSize: 11, marginBottom: 10 }} onClick={() => resetTierToAuto(song.id)}><RotateCcw size={11} /> Reset tier to auto</button>
                      )}

                      <div style={{ marginBottom: 12, position: "relative" }}>
                        {(song.awards || []).length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                            {song.awards.map((a, i) => (
                              <span key={i} title={a.label || ""} style={{ fontSize: 12, background: "#26223A", color: MUTED, borderRadius: 5, padding: "3px 8px", display: "inline-flex", alignItems: "center", gap: 5 }}>
                                {a.emoji} {a.label && <span>{a.label}</span>}<X size={11} style={{ cursor: "pointer" }} onClick={() => removeAward(song.id, i)} />
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button className="kp-input" style={{ width: 44, textAlign: "center", padding: "6px", cursor: "pointer" }} onClick={() => setAwardPickerFor(awardPickerFor === song.id ? null : song.id)}>{draft.emoji || "🏆"}</button>
                          {awardPickerFor === song.id && <div className="emoji-grid" style={{ top: 36, left: 0 }}>{AWARD_EMOJIS.map((e) => <button key={e} onClick={() => setAwardDrafts({ ...awardDrafts, [song.id]: { ...draft, emoji: e } })}>{e}</button>)}</div>}
                          <input className="kp-input" placeholder="What does this award mean?" style={{ fontSize: 12.5, padding: "6px 10px" }} value={draft.label} onChange={(e) => setAwardDrafts({ ...awardDrafts, [song.id]: { ...draft, label: e.target.value } })} onKeyDown={(e) => e.key === "Enter" && addAward(song.id)} />
                          <button className="kp-btn-ghost" style={{ padding: "6px 10px" }} onClick={() => addAward(song.id)}><Award size={13} /></button>
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Background image URL</div>
                        <input className="kp-input" placeholder="https://…" value={song.bgImage || ""} onChange={(e) => updateSongField(song.id, "bgImage", e.target.value)} style={{ fontSize: 12.5, padding: "6px 10px" }} />
                      </div>

                      <div style={{ fontSize: 11, color: MUTED, margin: "10px 0" }}>added by {song.addedBy || "someone"} · {timeAgo(song.createdAt)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Avatar modal */}
      {showAvatarModal && (
        <Modal title="Profile picture" onClose={() => setShowAvatarModal(false)}>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 10 }}>Paste a link to an image. Optional — leave blank to use your initial instead.</div>
          <input className="kp-input" placeholder="https://…" value={avatarDraft} onChange={(e) => setAvatarDraft(e.target.value)} style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="kp-btn" onClick={() => { saveAvatar(avatarDraft.trim()); setShowAvatarModal(false); }}>Save</button>
            <button className="kp-btn-ghost" onClick={() => { saveAvatar(""); setShowAvatarModal(false); }}>Remove</button>
          </div>
        </Modal>
      )}

      {/* Import List modal */}
      {showImport && (
        <Modal title="Import list" onClose={() => setShowImport(false)} wide>
          <label className="kp-btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12, cursor: "pointer" }}>
            <Download size={13} style={{ transform: "rotate(180deg)" }} /> Upload .txt or .json file
            <input type="file" accept=".txt,.json,text/plain,application/json" style={{ display: "none" }} onChange={handleImportFile} />
          </label>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>.json files exported from this app import fully, including awards and notes. .txt files import title/artist/album/year/score/tier.</div>
          <div style={{ fontSize: 12, color: theme.secondary, marginBottom: 4, fontWeight: 600 }}>Or paste directly — Song, Artist, Album, Year, Score, Tier</div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 10 }}>One per line. Tabs from a spreadsheet paste work automatically.</div>
          <textarea className="kp-input" style={{ minHeight: 160, resize: "vertical", fontFamily: "monospace", fontSize: 12.5, lineHeight: 1.6 }} placeholder={"I Want U, SHINee, The Story of Light, 2016, 95, X"} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ fontSize: 12, color: MUTED }}>{bulkParsed.length} song{bulkParsed.length === 1 ? "" : "s"} detected</span>
            <button className="kp-btn" disabled={!bulkParsed.length} onClick={addBulkSongs}>Add {bulkParsed.length || ""} song{bulkParsed.length === 1 ? "" : "s"}</button>
          </div>
        </Modal>
      )}

      {/* Add Song modal */}
      {showAdd && (
        <Modal title="Add a song" onClose={() => setShowAdd(false)}>
          <div className="kp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input className="kp-input" placeholder="Song title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <input className="kp-input" placeholder="Artist / group" value={newArtist} onChange={(e) => setNewArtist(e.target.value)} />
          </div>
          <div className="kp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input className="kp-input" placeholder="Album" value={newAlbum} onChange={(e) => setNewAlbum(e.target.value)} />
            <input className="kp-input" type="number" placeholder="Year" value={newYear} onChange={(e) => setNewYear(e.target.value)} />
          </div>
          <div className="kp-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <input className="kp-input" type="number" max={scoreScale} placeholder={`Score (out of ${scoreScale})`} value={newScore} onChange={(e) => setNewScore(e.target.value)} />
            <input className="kp-input" placeholder="Tier — optional" value={newTier} onChange={(e) => setNewTier(e.target.value)} />
          </div>
          <input className="kp-input" placeholder="Background image URL — optional" value={newBg} onChange={(e) => setNewBg(e.target.value)} style={{ marginBottom: 14 }} />
          <button className="kp-btn" onClick={addSong}>Add to list</button>
        </Modal>
      )}

      {/* Rank / search modal */}
      {showRank && (
        <Modal title="Search to rank" onClose={() => setShowRank(false)} wide>
          <input className="kp-input" placeholder="Search song, artist, or album…" value={rankQuery} onChange={(e) => setRankQuery(e.target.value)} style={{ marginBottom: 10 }} autoFocus />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 14 }}>
              {[["song", "Song"], ["artist", "Artist"], ["album", "Album"]].map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: MUTED, cursor: "pointer" }}>
                  <input type="checkbox" checked={searchIn[key]} onChange={(e) => { const next = { ...searchIn, [key]: e.target.checked }; if (Object.values(next).some(Boolean)) setSearchIn(next); }} /> {label}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11.5, color: MUTED }}>Sort by</span>
              <select className="kp-input" style={{ width: "auto", padding: "6px 10px", fontSize: 12.5 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="desc">Release Date ↓</option><option value="asc">Release Date ↑</option>
              </select>
            </div>
          </div>

          {!rankQuery.trim() ? (
            <div style={{ fontSize: 13, color: MUTED, textAlign: "center", padding: "20px 0" }}>Start typing to search the catalog.</div>
          ) : (
            <>
              {catalogResults.artists.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Artists</div>
                  {catalogResults.artists.map((ar, i) => {
                    const newCount = ar.songs.filter(([t, a]) => !activeKeySet.has(`${t}|${a}`.toLowerCase())).length;
                    const isOpen = expandedArtists[ar.artist];
                    return (
                      <div key={i}>
                        <div className="result-row">
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => setExpandedArtists({ ...expandedArtists, [ar.artist]: !isOpen })}>{isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
                            <Users size={16} color={MUTED} />
                            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{ar.artist} <span style={{ color: MUTED, fontWeight: 400, fontSize: 11.5 }}>· {ar.songs.length} songs</span></div>
                          </div>
                          <button className="kp-btn-bright" disabled={newCount === 0} onClick={() => triggerAdd(ar.songs, `Artist: ${ar.artist}`)}>{newCount === 0 ? "All added" : `+ Add all ${newCount}`}</button>
                        </div>
                        {isOpen && (
                          <div style={{ paddingLeft: 30 }}>
                            {ar.songs.map(([t, a, al, y], j) => {
                              const existing = findExistingSong(t, a);
                              return (
                                <div key={j} className="result-row" style={{ padding: "6px 0" }}>
                                  <div style={{ fontSize: 12.5, color: TEXT, cursor: existing ? "pointer" : "default" }} onClick={() => existing && jumpToSong(existing.id)}>{t} <span style={{ color: MUTED }}>· {al}{y ? ` · ${y}` : ""}</span></div>
                                  {existing ? <span style={{ fontSize: 11, color: MUTED }}>added</span> : <button className="kp-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => triggerAdd([[t, a, al, y]], `${t} — ${a}`)}><Plus size={11} /></button>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {catalogResults.albums.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Albums</div>
                  {catalogResults.albums.map((al, i) => {
                    const newCount = al.songs.filter(([t, a]) => !activeKeySet.has(`${t}|${a}`.toLowerCase())).length;
                    const isOpen = expandedAlbums[`${al.album}|${al.artist}`];
                    return (
                      <div key={i}>
                        <div className="result-row">
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => setExpandedAlbums({ ...expandedAlbums, [`${al.album}|${al.artist}`]: !isOpen })}>{isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
                            <Disc3 size={16} color={MUTED} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{al.album}</div>
                              <div style={{ fontSize: 11.5, color: theme.secondary }}>{al.artist} · {al.songs.length} songs{al.year ? ` · ${al.year}` : ""}</div>
                            </div>
                          </div>
                          <button className="kp-btn-bright" disabled={newCount === 0} onClick={() => triggerAdd(al.songs, `Album: ${al.album}`)}>{newCount === 0 ? "All added" : `+ Add ${newCount}`}</button>
                        </div>
                        {isOpen && (
                          <div style={{ paddingLeft: 30 }}>
                            {al.songs.map(([t, a, alb, y], j) => {
                              const existing = findExistingSong(t, a);
                              return (
                                <div key={j} className="result-row" style={{ padding: "6px 0" }}>
                                  <div style={{ fontSize: 12.5, color: TEXT, cursor: existing ? "pointer" : "default" }} onClick={() => existing && jumpToSong(existing.id)}>{t}</div>
                                  {existing ? <span style={{ fontSize: 11, color: MUTED }}>added</span> : <button className="kp-btn-ghost" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => triggerAdd([[t, a, alb, y]], `${t} — ${a}`)}><Plus size={11} /></button>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Songs</div>
                {catalogResults.songs.length === 0 ? <div style={{ fontSize: 13, color: MUTED, textAlign: "center", padding: "16px 0" }}>No matches.</div> : (
                  catalogResults.songs.map(([title, artist, album, year], i) => {
                    const existing = findExistingSong(title, artist);
                    return (
                      <div key={i} className="result-row">
                        <div style={{ minWidth: 0, cursor: existing ? "pointer" : "default" }} onClick={() => existing && jumpToSong(existing.id)}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
                          <div style={{ fontSize: 11.5, color: theme.secondary }}>{artist} · {album}{year ? ` · ${year}` : ""}</div>
                        </div>
                        {existing ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: MUTED }}>your score</span>
                            <input className="kp-input" type="number" max={scoreScale} style={{ width: 60, padding: "5px 6px" }} value={existing.score ?? ""} placeholder="—" onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateSongField(existing.id, "score", e.target.value === "" ? null : Math.min(scoreScale, Number(e.target.value)))} />
                          </div>
                        ) : <button className="kp-btn-ghost" style={{ padding: "6px 10px", fontSize: 12, flexShrink: 0 }} onClick={() => triggerAdd([[title, artist, album, year]], `${title} — ${artist}`)}><Plus size={12} /> Add</button>}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </Modal>
      )}

      {/* Add-confirm overlay (fast mode) */}
      {showAddConfirm && (
        <Modal title={addConfirmItems.length === 1 ? "Add this song?" : `Add ${addConfirmItems.length} songs`} onClose={() => setShowAddConfirm(false)} wide={addConfirmItems.length > 1}>
          {addConfirmItems.length === 1 ? (
            <div style={{ marginBottom: 18 }}>
              <div className="display" style={{ fontSize: 24, color: TEXT }}>{addConfirmItems[0][0]}</div>
              <div style={{ fontSize: 13, color: theme.secondary, fontWeight: 600 }}>{addConfirmItems[0][1]}</div>
              <div style={{ fontSize: 12, color: MUTED }}>{addConfirmItems[0][2]}{addConfirmItems[0][3] ? ` · ${addConfirmItems[0][3]}` : ""}</div>
            </div>
          ) : (
            <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 14 }}>
              {addConfirmItems.map(([t, a, al, y], i) => {
                const key = `${t}|${a}`;
                return (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}>
                    <input type="checkbox" checked={!!addConfirmChecked[key]} onChange={(e) => setAddConfirmChecked({ ...addConfirmChecked, [key]: e.target.checked })} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{t}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{a} · {al}{y ? ` · ${y}` : ""}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Background image URL — optional{addConfirmItems.length > 1 ? ", applies to all" : ""}</div>
            <input className="kp-input" placeholder="https://…" value={addConfirmBg} onChange={(e) => setAddConfirmBg(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="kp-btn-ghost" onClick={() => setShowAddConfirm(false)}>Cancel</button>
            <button className="kp-btn" onClick={commitAddConfirm}>Confirm</button>
          </div>
        </Modal>
      )}

      {/* Big-add confirmation */}
      {showBigAddConfirm && (
        <Modal title="Add a lot of songs?" onClose={() => setShowBigAddConfirm(false)}>
          <div style={{ fontSize: 13.5, color: TEXT, marginBottom: 16 }}>This will add <strong>{pendingBigAdd.length} songs</strong> to your list. Continue?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="kp-btn-ghost" onClick={() => setShowBigAddConfirm(false)}>Cancel</button>
            <button className="kp-btn" onClick={confirmBigAdd}>Add {pendingBigAdd.length} songs</button>
          </div>
        </Modal>
      )}

      {/* Detailed-mode review overlay — used both for adding new songs and working through the Unranked queue */}
      {showReview && reviewQueue.length > 0 && (() => {
        const currentSong = reviewExisting ? activeList.songs.find((s) => s.id === reviewQueue[reviewIndex]) : null;
        if (reviewExisting && !currentSong) { advanceReview(); return null; }
        const [title, artist, album, year] = reviewExisting ? [currentSong.title, currentSong.artist, currentSong.album, currentSong.year] : reviewQueue[reviewIndex];
        const isLast = reviewIndex + 1 >= reviewQueue.length;
        return (
          <Modal title={`Track ${reviewIndex + 1} of ${reviewQueue.length}`} onClose={() => { setShowReview(false); setReviewQueue([]); setReviewExisting(false); }}>
            {reviewQueue.length > 1 ? (
              <select className="review-title-select" value={reviewIndex} onChange={(e) => jumpReviewTo(Number(e.target.value))}>
                {reviewQueue.map((item, i) => {
                  const t = reviewExisting ? activeList.songs.find((s) => s.id === item)?.title || "Untitled" : item[0];
                  return <option key={i} value={i}>{t}</option>;
                })}
              </select>
            ) : (
              <div className="display" style={{ fontSize: 24, color: TEXT }}>{title}</div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: theme.secondary, fontWeight: 600 }}>{artist}</div>
              <div style={{ fontSize: 12, color: MUTED }}>{album}{year ? ` · ${year}` : ""}</div>
            </div>

            {activeList.advancedMode ? (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Category scores (out of 100)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {(activeList.categories || DEFAULT_CATEGORIES()).map((c) => (
                    <div key={c.id} style={{ textAlign: "center" }}>
                      <input className="kp-input" type="number" min={0} max={c.max || 100} style={{ width: 60, padding: 6, textAlign: "center" }} value={reviewDraft.categoryScores[c.id] ?? ""} placeholder="—"
                        onChange={(e) => setReviewDraft({ ...reviewDraft, categoryScores: { ...reviewDraft.categoryScores, [c.id]: e.target.value } })} />
                      <div style={{ fontSize: 10.5, color: MUTED, marginTop: 3 }}>{c.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <input className="kp-input" type="number" max={scoreScale} placeholder={`Score (out of ${scoreScale})`} value={reviewDraft.score} onChange={(e) => setReviewDraft({ ...reviewDraft, score: e.target.value })} style={{ marginBottom: 10 }} autoFocus />
            )}
            <input className="kp-input" placeholder="Tier — optional" value={reviewDraft.tier} onChange={(e) => setReviewDraft({ ...reviewDraft, tier: e.target.value })} style={{ marginBottom: 10 }} />
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: "4px 0 14px" }} />
            <input className="kp-input" placeholder="Background image URL — optional" value={reviewDraft.bgImage} onChange={(e) => setReviewDraft({ ...reviewDraft, bgImage: e.target.value })} style={{ marginBottom: 10 }} />

            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 10, position: "relative" }}>
              <button className="kp-input" style={{ width: 44, textAlign: "center", padding: 6, cursor: "pointer" }} onClick={() => setReviewAwardPicker(!reviewAwardPicker)}>{reviewDraft.awardEmoji || "🏆"}</button>
              {reviewAwardPicker && <div className="emoji-grid" style={{ top: 40, left: 0 }}>{AWARD_EMOJIS.map((e) => <button key={e} onClick={() => { setReviewDraft({ ...reviewDraft, awardEmoji: e }); setReviewAwardPicker(false); }}>{e}</button>)}</div>}
              <input className="kp-input" placeholder="Award — optional" style={{ fontSize: 12.5 }} value={reviewDraft.awardLabel} onChange={(e) => setReviewDraft({ ...reviewDraft, awardLabel: e.target.value })} />
            </div>
            <input className="kp-input" placeholder="Note — optional" value={reviewDraft.note} onChange={(e) => setReviewDraft({ ...reviewDraft, note: e.target.value })} style={{ marginBottom: 18 }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="kp-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={reviewSkip}>Skip</button>
                {reviewQueue.length > 1 && <button className="kp-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={skipRestOfReview}>Skip rest</button>}
                {!reviewExisting && <button className="kp-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => reviewCommit(true)}>Add to list unranked</button>}
              </div>
              <button className="kp-btn" style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={() => reviewCommit(false)}>{isLast ? (reviewExisting ? "Save & Finish" : "Add & Finish") : (reviewExisting ? "Save & Next" : "Add & Next")}</button>
            </div>
          </Modal>
        );
      })()}

      {/* Remove songs modal */}
      {showRemove && (
        <Modal title="Remove songs" onClose={() => setShowRemove(false)}>
          <div style={{ fontSize: 12, color: MUTED, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Undo a recent add</div>
          {recentAdds.length === 0 ? <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 18 }}>Nothing added yet this session.</div> : (
            <div style={{ marginBottom: 18 }}>
              {recentAdds.map((entry) => (
                <div key={entry.id} className="result-row">
                  <div style={{ fontSize: 13, color: TEXT }}>{entry.label} <span style={{ color: MUTED, fontSize: 11 }}>· {entry.songIds.length} song{entry.songIds.length === 1 ? "" : "s"} · {timeAgo(entry.ts)}</span></div>
                  <button className="kp-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => undoAdd(entry)}><RotateCcw size={12} /> Undo</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: MUTED, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Remove by artist</div>
          {artistsInList.length === 0 ? <div style={{ fontSize: 13, color: MUTED }}>Nothing to remove yet.</div> : artistsInList.map((a) => (
            <div key={a.artist} className="result-row">
              {confirmArtist === a.artist ? (
                <>
                  <div style={{ fontSize: 12.5, color: theme.accent }}>Remove all {a.count} songs by {a.artist}?</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="kp-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => setConfirmArtist(null)}>Cancel</button>
                    <button className="kp-btn" style={{ padding: "5px 10px", fontSize: 12, background: theme.accent }} onClick={() => { removeArtist(a.artist); setConfirmArtist(null); }}>Yes, remove</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.artist} <span style={{ color: MUTED, fontWeight: 400, fontSize: 11.5 }}>· {a.count} songs</span></div>
                  <button className="kp-btn-ghost" style={{ padding: "6px 10px", fontSize: 12, color: theme.accent, borderColor: theme.accent }} onClick={() => setConfirmArtist(a.artist)}><Trash2 size={12} /> Remove all</button>
                </>
              )}
            </div>
          ))}
        </Modal>
      )}

      {/* New list modal */}
      {showNewList && (
        <Modal title="Create a new list" onClose={() => setShowNewList(false)}>
          <input className="kp-input" placeholder="List name" value={newListName} onChange={(e) => setNewListName(e.target.value)} style={{ marginBottom: 10 }} autoFocus />
          <input className="kp-input" placeholder="Tags — comma separated, optional" value={newListTags} onChange={(e) => setNewListTags(e.target.value)} style={{ marginBottom: 10 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: MUTED }}>Max Score</span>
            <input className="kp-input" type="number" min={1} max={1000} style={{ width: 90 }} value={newListScale} onChange={(e) => setNewListScale(Math.max(1, Math.min(1000, Number(e.target.value) || 1)))} />
          </div>
          <button className="kp-btn" onClick={createList}>Create list</button>
        </Modal>
      )}

      {/* List options modal */}
      {showListOptions && (
        <Modal title="List options" onClose={() => setShowListOptions(false)} wide>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Scoring mode</div>
          <div className="mode-toggle" style={{ marginBottom: 10 }}>
            <button className={!activeList.advancedMode ? "active" : ""} onClick={() => updateActiveList({ advancedMode: false })}>Basic Scoring</button>
            <button className={activeList.advancedMode && (activeList.advancedScoreMode || "sum") === "sum" ? "active" : ""} onClick={() => { const cats = (activeList.categories?.length ? activeList.categories : DEFAULT_CATEGORIES()).map((c) => ({ ...c, max: c.max || 100 })); updateActiveList({ advancedMode: true, advancedScoreMode: "sum", categories: cats, scoreScale: cats.reduce((sum, c) => sum + (Number(c.max) || 100), 0) }); }}>Sum Scoring</button>
            <button className={activeList.advancedMode && activeList.advancedScoreMode === "weighted" ? "active" : ""} onClick={() => updateActiveList({ advancedMode: true, advancedScoreMode: "weighted", categories: activeList.categories?.length ? activeList.categories : DEFAULT_CATEGORIES() })}>Weighted Scoring</button>
          </div>
          {activeList.advancedMode && (
            <div style={{ background: "#26223A", borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 10 }}>
                {(activeList.advancedScoreMode || "sum") === "sum" ? "Each category is scored 0–100 and simply added together for the final score." : "Each category is scored 0–100. The weighted average becomes the final score, scaled to your Max Score."}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {(activeList.categories || DEFAULT_CATEGORIES()).map((c) => (
                  <div key={c.id} style={{ background: CARD, borderRadius: 8, padding: 10, width: 140 }}>
                    <input className="kp-input" style={{ fontSize: 12, padding: "6px 8px", marginBottom: 6 }} value={c.name} onChange={(e) => updateCategory(c.id, { name: e.target.value })} />
                    {activeList.advancedScoreMode === "weighted" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input className="kp-input" type="number" min={0} max={100} style={{ width: 55, padding: "4px 6px", fontSize: 12 }} value={c.weight} onChange={(e) => updateCategory(c.id, { weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
                        <span style={{ fontSize: 11, color: MUTED }}>weight</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input className="kp-input" type="number" min={1} max={1000} style={{ width: 55, padding: "4px 6px", fontSize: 12 }} value={c.max ?? 100} onChange={(e) => updateCategory(c.id, { max: Math.max(1, Math.min(1000, Number(e.target.value) || 1)) })} />
                        <span style={{ fontSize: 11, color: MUTED }}>max</span>
                      </div>
                    )}
                    <button className="kp-btn-ghost" style={{ padding: "3px 6px", fontSize: 10.5, marginTop: 6 }} onClick={() => removeCategory(c.id)}><X size={10} /> Remove</button>
                  </div>
                ))}
                {(activeList.categories || []).length < 8 && <button className="icon-btn" style={{ width: 44, height: 44, alignSelf: "center" }} onClick={addCategory}><Plus size={16} /></button>}
              </div>
            </div>
          )}

          <div style={{ fontSize: 12, color: MUTED, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Score</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: MUTED }}>Max Score</span>
            <input className="kp-input" type="number" min={1} max={1000} style={{ width: 90 }} value={activeList.scoreScale} disabled={activeList.advancedMode && activeList.advancedScoreMode === "sum"}
              onChange={(e) => updateActiveList({ scoreScale: Math.max(1, Math.min(1000, Number(e.target.value) || 1)) })} />
            {activeList.advancedMode && activeList.advancedScoreMode === "sum" && <span style={{ fontSize: 11, color: MUTED }}>(auto-set: sum of each category's max)</span>}
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: MUTED, cursor: "pointer" }}><input type="checkbox" checked={activeList.showScore} onChange={(e) => updateActiveList({ showScore: e.target.checked })} /> Show score</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: MUTED, cursor: "pointer" }}><input type="checkbox" checked={activeList.showTier} onChange={(e) => updateActiveList({ showTier: e.target.checked })} /> Show tier</label>
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>Negative scores are allowed.</div>

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: MUTED, cursor: "pointer", marginBottom: 4 }}>
            <input type="checkbox" checked={!!activeList.autoArtistImages} onChange={(e) => updateActiveList({ autoArtistImages: e.target.checked })} /> Show artist photos
          </label>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>Fetches a small artist photo next to each song from Wikipedia (falls back to iTunes artwork if no Wikipedia photo is found). Makes a network request per artist and caches results in your browser.</div>

          <div style={{ fontSize: 12, color: MUTED, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Score color</div>
          <div className="mode-toggle" style={{ marginBottom: 12 }}>
            {["single", "gradient", "thresholds"].map((m) => <button key={m} className={activeList.scoreColorMode === m ? "active" : ""} onClick={() => updateActiveList({ scoreColorMode: m })} style={{ textTransform: "capitalize" }}>{m}</button>)}
          </div>
          {activeList.scoreColorMode === "single" && <div style={{ marginBottom: 20 }}><input type="color" value={activeList.scoreColorSingle} onChange={(e) => updateActiveList({ scoreColorSingle: e.target.value })} /></div>}
          {activeList.scoreColorMode === "gradient" && (
            <div style={{ display: "flex", gap: 24, marginBottom: 20, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}><input type="color" value={activeList.scoreGradientFrom} onChange={(e) => updateActiveList({ scoreGradientFrom: e.target.value })} /><div style={{ fontSize: 10.5, color: MUTED, marginTop: 4 }}>Score 0</div></div>
              <div style={{ textAlign: "center" }}><input type="color" value={activeList.scoreGradientTo} onChange={(e) => updateActiveList({ scoreGradientTo: e.target.value })} /><div style={{ fontSize: 10.5, color: MUTED, marginTop: 4 }}>Score {activeList.scoreScale}</div></div>
            </div>
          )}
          {activeList.scoreColorMode === "thresholds" && (
            <div style={{ marginBottom: 20 }}>
              {(activeList.scoreColorStops || []).map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <input type="color" value={s.color} onChange={(e) => updateColorStop(s.id, { color: e.target.value })} />
                  <span style={{ fontSize: 12, color: MUTED }}>at score ≥</span>
                  <input className="kp-input" type="number" style={{ width: 80 }} value={s.score} onChange={(e) => updateColorStop(s.id, { score: Number(e.target.value) || 0 })} />
                  <X size={13} style={{ cursor: "pointer", color: MUTED }} onClick={() => removeColorStop(s.id)} />
                </div>
              ))}
              {(activeList.scoreColorStops || []).length < 5 && <button className="kp-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={addColorStop}><Plus size={11} /> Add color stop</button>}
            </div>
          )}

          <div style={{ borderTop: `1px solid ${BORDER}`, margin: "4px 0 20px" }} />

          <div style={{ fontSize: 12, color: MUTED, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tiers</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {(activeList.tierNames || []).map((t, i) => (
              <div key={t.id} className="tier-chip" draggable onDragStart={() => (dragTierIndex.current = i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragTierIndex.current !== null) reorderTier(dragTierIndex.current, i); dragTierIndex.current = null; }}>
                <GripVertical size={12} color={MUTED} />
                <input type="color" value={t.color} onChange={(e) => updateTier(t.id, { color: e.target.value })} style={{ width: 18, height: 18 }} />
                <input className="kp-input" style={{ width: 70, padding: "3px 6px", fontSize: 12, background: "transparent", border: "none" }} value={t.name} onChange={(e) => updateTier(t.id, { name: e.target.value })} />
                <X size={12} style={{ cursor: "pointer", color: MUTED }} onClick={() => removeTier(t.id)} />
              </div>
            ))}
            {(activeList.tierNames || []).length < 20 && <button className="kp-btn-ghost" style={{ padding: "4px 10px", fontSize: 11.5 }} onClick={addTierName}><Plus size={11} /> Add tier</button>}
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>Drag tiers to reorder. Editing a song's tier directly on the list always overrides auto-tiering, until reset. Up to 20 tiers.</div>

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: MUTED, cursor: "pointer", marginBottom: 10 }}>
            <input type="checkbox" checked={activeList.autoTier} onChange={(e) => updateActiveList({ autoTier: e.target.checked })} /> Auto-tier based on score
          </label>
          {activeList.autoTier && (
            <div style={{ background: "#26223A", borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 10 }}>Highest matching threshold wins. Songs below every threshold show "NULL".</div>
              {(activeList.autoTierRules || []).sort((a, b) => b.minScore - a.minScore).map((r) => (
                <div key={r.id} className="result-row" style={{ padding: "6px 0" }}>
                  <span style={{ fontSize: 12.5 }}>score ≥ {r.minScore} → <strong style={{ color: theme.secondary }}>{r.tierName}</strong></span>
                  <X size={13} style={{ cursor: "pointer", color: MUTED }} onClick={() => removeAutoRule(r.id)} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input className="kp-input" type="number" placeholder="min score" style={{ width: 90 }} value={newRuleScore} onChange={(e) => setNewRuleScore(e.target.value)} />
                <input className="kp-input" placeholder="tier name" value={newRuleTier} onChange={(e) => setNewRuleTier(e.target.value)} />
                <button className="kp-btn-ghost" onClick={addAutoRule}><Plus size={12} /></button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="kp-btn-ghost" onClick={duplicateList}><Copy size={13} /> Duplicate this list</button>
              <button className="kp-btn-ghost" onClick={() => exportList("json")}><Download size={13} /> Export .json</button>
              <button className="kp-btn-ghost" onClick={() => exportList("txt")}><Download size={13} /> Export .txt</button>
            </div>
            {confirmDeleteList ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: theme.accent }}>Delete "{activeList.name}"?</span>
                <button className="kp-btn-ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => setConfirmDeleteList(false)}>Cancel</button>
                <button className="kp-btn" style={{ padding: "5px 10px", fontSize: 12, background: theme.accent }} onClick={deleteActiveList}>Yes, delete</button>
              </div>
            ) : (
              <button className="kp-btn-ghost" style={{ color: theme.accent, borderColor: theme.accent }} onClick={() => setConfirmDeleteList(true)}><Trash2 size={13} /> Delete this list</button>
            )}
          </div>
        </Modal>
      )}

      {/* Settings modal */}
      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 8, fontWeight: 600 }}>Ranking mode</div>
          <div className="mode-toggle" style={{ marginBottom: 10 }}>
            <button className={rankMode === "detailed" ? "active" : ""} onClick={() => saveRankMode("detailed")}>Detailed</button>
            <button className={rankMode === "fast" ? "active" : ""} onClick={() => saveRankMode("fast")}>Fast</button>
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginBottom: 20 }}>{rankMode === "detailed" ? "Adding songs or an album steps through them one at a time so you can score, tier, note, and award each before moving on." : "Adding songs or an album opens a quick confirm step, then adds them all at once."}</div>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 8, fontWeight: 600 }}>Theme</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            {[["background", "Background"], ["accent", "Accent"], ["secondary", "Secondary"], ["highlight", "Score color"]].map(([key, label]) => (
              <div key={key} style={{ textAlign: "center" }}>
                <input type="color" value={theme[key]} onChange={(e) => saveTheme({ ...theme, [key]: e.target.value })} />
                <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>{label}</div>
              </div>
            ))}
            <button className="kp-btn-ghost" onClick={() => saveTheme(DEFAULT_THEME)}><RotateCcw size={13} /> Reset</button>
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>Colors and ranking mode are saved on your device only.</div>
        </Modal>
      )}
    </div>
  );
}
