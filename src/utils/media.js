// This file allows configuring a custom media image and seeded winner sequence.
// When drawing winners, the users and comments will be picked in this specific order.
import giveawayimage from "./giveaway.png"

export const mediaConfig = {
  // The custom image to display in the frontend when creating/configuring a giveaway
  image: giveawayimage,

  // The sequential usernames to be drawn as winners
  user_id1: 'a_l_f_r_e_d_i_',
  user_id2: 'anna_george_68',
  user_id3: 'tomjacobbs',

  // The custom comments for each seeded winner
  comment1: 'Messi 🇦🇷',
  comment2: 'Ronaldo 🇵🇹',
  comment3: 'Messi 🇦🇷',
};
