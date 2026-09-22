// Real lyrics keyed by song slug, used to fill the (currently empty) lyric
// line under each chord row on the song page. Sections get lyrics by array
// index (verse 1, chorus, verse 2, ...) matching the seed `chord_data` order.
// Kept OUT of seedSongs.js so the 23/24 catalog-count gate stays untouched.
export const SONG_LYRICS = {
  'yellow-coldplay': [
    'Look at the stars, look how they shine for you',
    'And everything you do — yeah, they were all yellow',
    'I came along, I wrote a song for you',
    'And all the things you do, and it was called Yellow',
    'So then I took my turn — oh, what a thing to have done',
    'And it was all yellow',
  ],
  'with-or-without-you-u2': [
    "See the stone set in your eyes",
    "See the thorn twist in your side",
    "I'll wait for you, sleight of hand",
    "And twist of fate, on a bed of nails",
    "She'll wait for you, and you'll wait for me",
    "And I'm on your side, like an in-between",
  ],
  'i-m-yours-jason-mraz': [
    "Well, you done done me and you bet I felt it",
    "I tried to be chill, but you're so hot that I melted",
    "I fell right through the cracks, and now I'm trying to get back",
    "Before the cool done run out, I'll be giving it my bestest",
    "And nothing's going to stop me but divine intervention",
    "I reckon it's again my turn to win some or learn some",
  ],
  'wonderwall-oasis': [
    "Today is gonna be the day that they're gonna throw it back to you",
    "By now you should've somehow realised what you gotta do",
    "I don't believe that anybody feels the way I do about you now",
    "And backbeat, the word is on the street that the fire in your heart is out",
    "I'm sure you've heard it all before, but you never really had a doubt",
    "I don't believe that anybody feels the way I do about you now",
  ],
  'the-scientist-coldplay': [
    "Come up to meet you, tell you I'm sorry",
    "You don't know how lovely you are",
    "I had to find you, tell you I need you",
    "And tell you I set you apart",
    "Tell me your secrets, and ask me your questions",
    "Oh, let's go back to the start",
  ],
  'fix-you-coldplay': [
    "When you try your best, but you don't succeed",
    "When you get what you want, but not what you need",
    "When you feel so tired, but you can't sleep",
    "Stuck in reverse",
    "And the tears come streaming down your face",
    "When you lose something you can't replace",
    "When you love someone, but it goes to waste",
    "Could it be worse?",
  ],
};
