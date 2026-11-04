# Automatic uploads with Make.com (no Google Cloud)

How it works:

```
Claude Code ──► outbox folder on your computer ──(Google Drive for desktop syncs it)──► Google Drive
                                                                                          │
                        Make.com scenario, runs at 07:00 and 17:00 UK ◄───────────────────┘
                        uploads what is due to YouTube, writes done/<slug>.txt (video ID),
                        moves the job to done/
Claude Code ◄── python3 -m timesketch.publish --sync  (reads the receipts into the results log)
```

Free plan check: 2 runs a day plus about 10 operations per upload comes to roughly 700 of Make's
1,000 free operations a month at 2 Shorts a day. **File size:** Make's free plan caps files at 5 MB and a best-quality master is
about 14 MB, so the publisher **refuses** to queue it rather than quietly shrinking it. To keep full quality
on Make, upgrade to a paid Make plan with a bigger file limit and set `MAKE_MAX_MB` to that limit. To accept a
smaller copy instead, set `MAKE_SHRINK=1`. The Chrome route always uploads the original file.

## 1. Google Drive for desktop (free)

1. Install **Google Drive for desktop** (google.com/drive/download) and sign in.
2. In My Drive make the folders `TimeSketch/outbox` and `TimeSketch/outbox/done`.
3. Tell the pipeline where that folder is on your computer (put it in your shell profile so it sticks):
   - Mac: `export MAKE_OUTBOX="$HOME/Library/CloudStorage/GoogleDrive-YOUR@EMAIL/My Drive/TimeSketch/outbox"`
   - Windows (PowerShell): `$env:MAKE_OUTBOX="G:\My Drive\TimeSketch\outbox"`
   Check it: `ls "$MAKE_OUTBOX"` should show the `done` folder.

## 2. Make.com account

1. Sign up at make.com (Free plan).
2. Profile (bottom left) -> Profile -> **Time zone: Europe/London**. The schedule below depends on it.

## 3. Build the scenario

Scenarios -> **Create a new scenario**. Add these modules in order (click the `+` after each).
Module names can differ slightly in Make's menus. Search for the app, then pick the closest action.

| # | App -> action | Settings |
|---|---|---|
| 1 | **Google Drive -> Search for Files/Folders** | Connect your Google account. Search: in a specific folder -> `TimeSketch/outbox`. Type: Files. Query/filter: file name **ends with** `.json` (or Drive query `name contains '.json'`). Limit: 5. |
| 2 | **Google Drive -> Download a File** | File ID: `1. ID` |
| 3 | **JSON -> Parse JSON** | JSON string: `2. Data`. Data structure -> Add -> **Generator** -> paste the sample job below -> Save. |
| - | **Filter** (click the dotted line between 3 and 4) | Label "due". Condition: `now` **Datetime: later than or equal to** `parseDate(3.upload_after_utc; "YYYY-MM-DDTHH:mm:ssZ")` |
| 4 | **Google Drive -> Search for Files/Folders** | Same folder. File name **equals** `3. video_file`. Limit 1. |
| 5 | **Google Drive -> Download a File** | File ID: `4. ID` |
| 6 | **YouTube -> Upload a Video** | Connection: sign in and **choose the Time Sketch channel** (Brand Account). File: from module 5 (file name `3. video_file`, data `5. Data`). Title `3. title`, Description `3. description`, Tags `split(3.tags_csv; ",")`, Category **Education** (27), Privacy **Public**, Made for kids **No**. |
| 7 | **Google Drive -> Upload a File** | Folder `TimeSketch/outbox/done`. File name `3. slug` + `.txt`. Data: `6. ID` (the new video ID). |
| 8 | **Google Drive -> Move a File** | File `1. ID` (the json) -> folder `TimeSketch/outbox/done` |
| 9 | **Google Drive -> Move a File** | File `4. ID` (the mp4) -> folder `TimeSketch/outbox/done` |

Sample job for step 3 (this is exactly what the publisher writes):

```json
{"slug": "can-opener", "video_file": "can-opener.mp4", "title": "Cans Came 45 Years Before the Can Opener",
 "description": "Line one\nSources: ...", "tags_csv": "history shorts,can opener", "category_id": "27",
 "made_for_kids": false, "privacy": "public", "publish_at_utc": "2026-11-05T07:00:00Z",
 "upload_after_utc": "2026-11-05T06:30:00Z", "publish_at_uk": "Thu 05 Nov 2026 07:00"}
```

**Schedule:** click the clock on module 1 -> **Every day** -> **07:00**. Save, and name it
`Time Sketch uploader 07:00`. Then scenario menu (`...`) -> **Clone**, set its clock to **17:00**, and name it
`... 17:00`. Turn both **ON**. The free plan allows 2 active scenarios, so this uses both.

## 4. Test it once (private)

1. In module 6 set Privacy to **Private** for the test.
2. In Claude Code say: **"queue a Make test upload of the lighters episode for a past slot"**. It writes the
   title/description and runs `--make --slot <earlier today>`, so the job is due immediately.
   Wait until Drive has synced the two files.
3. In Make click **Run once**. Check YouTube Studio: the video should be there as private, with the title, description and tags.
4. Delete the test video in Studio, delete `done/lighters-before-matches.*` in Drive, remove that entry from
   `analytics/schedule.json`, and set module 6 back to **Public**.

## 5. Everyday use

```bash
python3 -m timesketch.publish episodes/<slug> --make     # checks, books the next 07:00/17:00 slot, drops it in the outbox
python3 -m timesketch.publish --sync                     # after it goes out: records the video ID for analytics
```

In Claude Code: "upload it" (the publisher agent uses `--make` when `MAKE_OUTBOX` is set).
You can queue a whole week at once; each job waits in the outbox until its slot.

If something fails, Make shows the error in the scenario's **History**. The job stays in the outbox,
so the next run tries again.
