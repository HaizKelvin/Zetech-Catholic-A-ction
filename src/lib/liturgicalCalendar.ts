import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyControl } from '../types';

export interface LiturgicalDay {
  dateKey: string; // "YYYY-MM-DD"
  monthDay: string; // "MM-DD"
  saintName: string;
  feastTitle: string;
  rank: 'Solemnity' | 'Feast' | 'Memorial' | 'Optional Memorial' | 'Commemoration';
  liturgicalColor: 'White' | 'Red' | 'Green' | 'Violet' | 'Rose';
  patronage: string;
  saintInfo: string;
  verse: string;
  reference: string;
  reflection: string;
}

/**
 * Rich authentic Roman Catholic Liturgical Calendar Database
 * Covers key feasts, solemnities, memorials, and daily Lectionary scriptures throughout the year.
 */
export const LITURGICAL_CALENDAR_DATABASE: Record<string, Omit<LiturgicalDay, 'dateKey' | 'monthDay'>> = {
  // January
  '01-01': {
    saintName: 'Mary, Mother of God',
    feastTitle: 'Solemnity of Mary, the Holy Mother of God',
    rank: 'Solemnity',
    liturgicalColor: 'White',
    patronage: 'All Humanity, The Church, Mothers',
    saintInfo: 'Celebrating the divine motherhood of the Blessed Virgin Mary (Theotokos), who brought forth the Prince of Peace into the world.',
    verse: 'And Mary kept all these things, reflecting on them in her heart.',
    reference: 'Luke 2:19',
    reflection: 'Start the year under the maternal protection of Our Lady, pondering God’s blessings in prayerful silence.'
  },
  '01-02': {
    saintName: 'Saints Basil the Great & Gregory Nazianzen',
    feastTitle: 'Memorial of Saints Basil the Great and Gregory Nazianzen, Bishops & Doctors',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Hospital administrators, theologians, poets',
    saintInfo: 'Cappadocian Fathers of the Church whose lifelong friendship, theological brilliance, and charity fortified Catholic Orthodoxy against heresy.',
    verse: 'He that hath two coats, let him impart to him that hath none; and he that hath meat, let him do likewise.',
    reference: 'Luke 3:11',
    reflection: 'True Christian brotherhood strengthens both intellect and charity for God’s kingdom.'
  },
  '01-03': {
    saintName: 'The Most Holy Name of Jesus',
    feastTitle: 'Optional Memorial of the Holy Name of Jesus',
    rank: 'Optional Memorial',
    liturgicalColor: 'White',
    patronage: 'All Christians',
    saintInfo: 'Commemorating the saving power and reverence due to the Holy Name of Jesus, at which every knee should bend.',
    verse: 'At the name of Jesus every knee should bow, in heaven and on earth and under the earth.',
    reference: 'Philippians 2:10',
    reflection: 'Invoking the sweet name of Jesus dispels darkness and anchors our soul in grace.'
  },
  '01-17': {
    saintName: 'Saint Anthony of the Desert',
    feastTitle: 'Memorial of Saint Anthony, Abbot',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Monks, basket makers, farmers',
    saintInfo: 'The Father of Christian Monasticism who gave away all worldly riches to seek holiness in prayer, fasting, and solitude in the Egyptian desert.',
    verse: 'If you wish to be perfect, go, sell what you have and give to the poor, and you will have treasure in heaven; and come, follow me.',
    reference: 'Matthew 19:21',
    reflection: 'Simplicity and detachment from worldly noise allow the voice of the Holy Spirit to resound within us.'
  },
  '01-25': {
    saintName: 'Conversion of Saint Paul the Apostle',
    feastTitle: 'Feast of the Conversion of Saint Paul the Apostle',
    rank: 'Feast',
    liturgicalColor: 'White',
    patronage: 'Evangelists, missionaries, writers',
    saintInfo: 'Commemorates Saul’s dramatic transformation on the Road to Damascus into Paul, the great Apostle to the Gentiles.',
    verse: 'I have been crucified with Christ; it is no longer I who live, but Christ lives in me.',
    reference: 'Galatians 2:20',
    reflection: 'No heart is too distant for the transforming mercy of Jesus Christ.'
  },
  '01-28': {
    saintName: 'Saint Thomas Aquinas',
    feastTitle: 'Memorial of Saint Thomas Aquinas, Priest & Doctor of the Church',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'University students, academics, Catholic schools',
    saintInfo: 'The Angelic Doctor, patron saint of university students, whose profound synthesis of faith and reason guides Catholic education worldwide.',
    verse: 'Grant me, O Lord my God, a mind to know you, a heart to seek you, wisdom to find you, and a faithfulness that may finally embrace you.',
    reference: 'Wisdom 9:4',
    reflection: 'Combine intellectual diligence with deep Eucharistic devotion in all your campus studies.'
  },
  '01-31': {
    saintName: 'Saint John Bosco',
    feastTitle: 'Memorial of Saint John Bosco, Priest',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Youth, apprentices, editors',
    saintInfo: 'Beloved champion of young people and founder of the Salesian family, guiding youth with reason, religion, and loving-kindness.',
    verse: 'Do not be overcome by evil, but overcome evil with good.',
    reference: 'Romans 12:21',
    reflection: 'Joy, study, and piety are the three wings that lift young hearts to heaven.'
  },

  // February
  '02-02': {
    saintName: 'The Presentation of the Lord (Candlemas)',
    feastTitle: 'Feast of the Presentation of the Lord',
    rank: 'Feast',
    liturgicalColor: 'White',
    patronage: 'Consecrated souls',
    saintInfo: 'Mary and Joseph present baby Jesus in the Jerusalem Temple, where righteous Simeon proclaimed Him a light of revelation to the Gentiles.',
    verse: 'A light for revelation to the Gentiles, and the glory of your people Israel.',
    reference: 'Luke 2:32',
    reflection: 'Let Christ illuminate your intellect, your career aspirations, and your relationships.'
  },
  '02-14': {
    saintName: 'Saints Cyril and Methodius',
    feastTitle: 'Memorial of Saints Cyril, Monk, and Methodius, Bishop',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Europe, unity of Christians',
    saintInfo: 'Holy brothers and Apostles to the Slavic peoples, translating scriptures and liturgy to bridge cultural and spiritual divides.',
    verse: 'How beautiful upon the mountains are the feet of him who brings good news, who publishes peace.',
    reference: 'Isaiah 52:7',
    reflection: 'Evangelization requires translating the love of Christ into the language of those we meet.'
  },

  // March
  '03-19': {
    saintName: 'Saint Joseph, Spouse of the Blessed Virgin Mary',
    feastTitle: 'Solemnity of Saint Joseph, Spouse of the B.V.M.',
    rank: 'Solemnity',
    liturgicalColor: 'White',
    patronage: 'Universal Church, workers, fathers, students',
    saintInfo: 'The silent guardian of the Redeemer, patron of workers and the Universal Church, a model of humble obedience, integrity, and faith.',
    verse: 'He did as the angel of the Lord commanded him; he took his wife into his home.',
    reference: 'Matthew 1:24',
    reflection: 'Quiet, dependable faithfulness in daily tasks is the true mark of spiritual greatness.'
  },
  '03-25': {
    saintName: 'The Annunciation of the Lord',
    feastTitle: 'Solemnity of the Annunciation of the Lord',
    rank: 'Solemnity',
    liturgicalColor: 'White',
    patronage: 'All Christians',
    saintInfo: 'The Archangel Gabriel announces the Incarnation to Mary, who answers with her humble "Fiat" — Behold the handmaid of the Lord.',
    verse: 'Behold, I am the handmaid of the Lord; let it be to me according to your word.',
    reference: 'Luke 1:38',
    reflection: 'Give your wholehearted "Yes" to God today, trusting that nothing is impossible with Him.'
  },

  // April
  '04-25': {
    saintName: 'Saint Mark the Evangelist',
    feastTitle: 'Feast of Saint Mark, Evangelist',
    rank: 'Feast',
    liturgicalColor: 'Red',
    patronage: 'Notaries, lawyers, Venice',
    saintInfo: 'Author of the second Gospel, companion of Saint Peter and Saint Paul, who proclaimed Christ’s power and deeds with boldness.',
    verse: 'Go into all the world and proclaim the gospel to the whole creation.',
    reference: 'Mark 16:15',
    reflection: 'Live as a living gospel so that people who do not read the Bible may read Christ in your actions.'
  },
  '04-29': {
    saintName: 'Saint Catherine of Siena',
    feastTitle: 'Memorial of Saint Catherine of Siena, Virgin & Doctor of the Church',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Europe, fire prevention, nursing',
    saintInfo: 'Dominican tertiary and Doctor of the Church who challenged popes and rulers with holy love, saying: "Be who God meant you to be and you will set the world on fire."',
    verse: 'Be who God meant you to be and you will set the world on fire.',
    reference: '1 Timothy 4:12',
    reflection: 'Authentic love for Christ dares to speak truth and bring renewal to our community.'
  },

  // May
  '05-01': {
    saintName: 'Saint Joseph the Worker',
    feastTitle: 'Optional Memorial of Saint Joseph the Worker',
    rank: 'Optional Memorial',
    liturgicalColor: 'White',
    patronage: 'Workers, craftsmen, carpenters',
    saintInfo: 'Instituted to sanctify human labor and dignity, remembering Jesus learning the carpentry trade under Saint Joseph in Nazareth.',
    verse: 'Whatever you do, work heartily, as for the Lord and not for men.',
    reference: 'Colossians 3:23',
    reflection: 'Offer up your daily assignments, chores, and projects as a fragrant offering to God.'
  },
  '05-26': {
    saintName: 'Saint Philip Neri',
    feastTitle: 'Memorial of Saint Philip Neri, Priest',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Joy, Rome, humor',
    saintInfo: 'The "Apostle of Joy" who brought laughter, music, and deep Eucharistic love to young pilgrims in Rome.',
    verse: 'Rejoice in the Lord always; again I will say, rejoice.',
    reference: 'Philippians 4:4',
    reflection: 'A cheerful heart attracts souls to Jesus far quicker than a gloomy spirit.'
  },

  // June
  '06-03': {
    saintName: 'Saints Charles Lwanga & Companions',
    feastTitle: 'Memorial of Saint Charles Lwanga and Companions, Martyrs of Uganda',
    rank: 'Memorial',
    liturgicalColor: 'Red',
    patronage: 'African youth, Catholic Action, sports',
    saintInfo: 'The courageous Uganda Martyrs who gave their lives in 1886 rather than compromise their Catholic faith and moral purity.',
    verse: 'Do not fear those who kill the body but cannot kill the soul.',
    reference: 'Matthew 10:28',
    reflection: 'Stand firm in Christian purity and brotherhood across your university journey, inspired by Africa’s own martyrs.'
  },
  '06-13': {
    saintName: 'Saint Anthony of Padua',
    feastTitle: 'Memorial of Saint Anthony of Padua, Priest & Doctor of the Church',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Lost articles, travelers, poor',
    saintInfo: 'Franciscan friar celebrated for his profound preaching, love for the poor, and miracle-working prayer life.',
    verse: 'The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness.',
    reference: 'Galatians 5:22',
    reflection: 'Actions speak louder than words; let your life preach the Gospel of Christ.'
  },
  '06-24': {
    saintName: 'The Nativity of Saint John the Baptist',
    feastTitle: 'Solemnity of the Nativity of Saint John the Baptist',
    rank: 'Solemnity',
    liturgicalColor: 'White',
    patronage: 'Baptism, conversion',
    saintInfo: 'The precursor of Christ who prepared the way in the wilderness, preaching repentance and humility.',
    verse: 'He must increase, but I must decrease.',
    reference: 'John 3:30',
    reflection: 'Cultivate authentic humility so that Jesus Christ shines through all your successes.'
  },
  '06-29': {
    saintName: 'Saints Peter and Paul, Apostles',
    feastTitle: 'Solemnity of Saints Peter and Paul, Apostles',
    rank: 'Solemnity',
    liturgicalColor: 'Red',
    patronage: 'The Universal Church, Rome',
    saintInfo: 'Pillars of the Apostolic Church: Peter the rock upon whom the Church is built, and Paul the herald to the nations.',
    verse: 'You are the Christ, the Son of the living God.',
    reference: 'Matthew 16:16',
    reflection: 'Our faith is grounded upon the unshakeable rock of apostolic truth and courageous witness.'
  },

  // July
  '07-11': {
    saintName: 'Saint Benedict of Nursia',
    feastTitle: 'Memorial of Saint Benedict, Abbot',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Europe, students, kidney disease',
    saintInfo: 'Father of Western Monasticism whose holy Rule "Ora et Labora" (Pray and Work) balanced disciplined prayer with fruitful work.',
    verse: 'Prefer nothing whatever to the love of Christ.',
    reference: 'Romans 8:38-39',
    reflection: 'Harmonize your academic labor with constant prayer throughout each campus day.'
  },
  '07-22': {
    saintName: 'Saint Mary Magdalene',
    feastTitle: 'Feast of Saint Mary Magdalene',
    rank: 'Feast',
    liturgicalColor: 'White',
    patronage: 'Contemplatives, converts, hairdressers',
    saintInfo: 'The "Apostle to the Apostles", the first witness to the Resurrection who ran to announce: "I have seen the Lord!"',
    verse: 'Mary Magdalene went and announced to the disciples, "I have seen the Lord."',
    reference: 'John 20:18',
    reflection: 'Share the good news of the Risen Lord with every classmate and friend you meet.'
  },

  // August
  '08-11': {
    saintName: 'Saint Clare of Assisi',
    feastTitle: 'Memorial of Saint Clare, Virgin',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Television, eye diseases',
    saintInfo: 'Companion of St. Francis and foundress of the Poor Clares, devoted to the holy poverty of Christ and Eucharistic adoration.',
    verse: 'Love God, serve God; everything is in that.',
    reference: 'Deuteronomy 6:5',
    reflection: 'Gaze upon the Eucharistic face of Christ, and your soul will reflect His heavenly peace.'
  },
  '08-15': {
    saintName: 'The Assumption of the Blessed Virgin Mary',
    feastTitle: 'Solemnity of the Assumption of the Blessed Virgin Mary',
    rank: 'Solemnity',
    liturgicalColor: 'White',
    patronage: 'The Universal Church',
    saintInfo: 'Celebrating Mary’s entrance body and soul into heavenly glory, pointing our eyes toward our ultimate heavenly destiny.',
    verse: 'My soul magnifies the Lord, and my spirit rejoices in God my Savior.',
    reference: 'Luke 1:46-47',
    reflection: 'Keep your gaze fixed on heaven; this earth is only our temporary pilgrimage.'
  },
  '08-27': {
    saintName: 'Saint Monica',
    feastTitle: 'Memorial of Saint Monica',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Mothers, troubled children',
    saintInfo: 'Model of unceasing prayer whose tears and persistent intercession brought about the conversion of her son Saint Augustine.',
    verse: 'Pray without ceasing. In all circumstances give thanks.',
    reference: '1 Thessalonians 5:17-18',
    reflection: 'Never give up on someone in prayer; God’s timing is always perfect.'
  },
  '08-28': {
    saintName: 'Saint Augustine of Hippo',
    feastTitle: 'Memorial of Saint Augustine, Bishop & Doctor of the Church',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Theologians, printers',
    saintInfo: 'One of the greatest minds in Christian history, author of the Confessions, whose heart found peace only in God.',
    verse: 'You have made us for yourself, O Lord, and our hearts are restless until they rest in you.',
    reference: 'Psalm 62:1',
    reflection: 'Worldly pleasures leave the soul empty; genuine peace is found only in Christ.'
  },

  // September
  '09-05': {
    saintName: 'Saint Teresa of Calcutta (Mother Teresa)',
    feastTitle: 'Memorial of Saint Teresa of Calcutta, Religious',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'World Youth Day, Missionaries of Charity',
    saintInfo: 'Founded the Missionaries of Charity to serve the "poorest of the poor", quenching the thirst of Jesus on the Cross through hands of mercy.',
    verse: 'Not all of us can do great things. But we can do small things with great love.',
    reference: '1 Corinthians 13:13',
    reflection: 'Perform small everyday kindnesses on campus with boundless Christian love.'
  },
  '09-14': {
    saintName: 'The Exaltation of the Holy Cross',
    feastTitle: 'Feast of the Exaltation of the Holy Cross',
    rank: 'Feast',
    liturgicalColor: 'Red',
    patronage: 'The Universal Church',
    saintInfo: 'Celebrating the Holy Cross as the instrument of our salvation and triumphant victory over sin and death.',
    verse: 'May I never boast except in the cross of our Lord Jesus Christ, through which the world has been crucified to me, and I to the world.',
    reference: 'Galatians 6:14',
    reflection: 'When life brings difficulties and burdens, carry your cross united with Jesus.'
  },
  '09-29': {
    saintName: 'Saints Michael, Gabriel & Raphael, Archangels',
    feastTitle: 'Feast of Saints Michael, Gabriel, and Raphael, Archangels',
    rank: 'Feast',
    liturgicalColor: 'White',
    patronage: 'Police, soldiers, travelers, sickness',
    saintInfo: 'The Archangels who defend God’s people: Michael our defender, Gabriel the messenger, and Raphael the medicine of God.',
    verse: 'For he will command his angels concerning you to guard you in all your ways.',
    reference: 'Psalm 91:11',
    reflection: 'Invoke the protection of the Holy Archangels against the spiritual battles of campus life.'
  },
  '09-30': {
    saintName: 'Saint Jerome',
    feastTitle: 'Memorial of Saint Jerome, Priest & Doctor of the Church',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Translators, librarians, biblical scholars',
    saintInfo: 'Translator of the Bible into Latin (the Vulgate), famously proclaiming: "Ignorance of Scripture is ignorance of Christ."',
    verse: 'Your word is a lamp to my feet and a light to my path.',
    reference: 'Psalm 119:105',
    reflection: 'Read a passage of the Holy Gospel every day before starting your studies.'
  },

  // October
  '10-01': {
    saintName: 'Saint Thérèse of the Child Jesus',
    feastTitle: 'Memorial of Saint Thérèse of Lisieux, Virgin & Doctor of the Church',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Missions, florists, aviators',
    saintInfo: 'The "Little Flower" who taught the "Little Way" of spiritual childhood: seeking sanctity through complete trust and love in everyday actions.',
    verse: 'My vocation is love! In the heart of the Church, my mother, I will be love.',
    reference: '1 Corinthians 13:8',
    reflection: 'You do not need grand heroics to become a saint; do your daily duties with immense love.'
  },
  '10-04': {
    saintName: 'Saint Francis of Assisi',
    feastTitle: 'Memorial of Saint Francis of Assisi',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Ecology, animals, peace, Italy',
    saintInfo: 'Rebuilder of the Church through holy poverty, peace, and brotherhood, bearing the holy stigmata of Jesus.',
    verse: 'Lord, make me an instrument of your peace. Where there is hatred, let me sow love.',
    reference: 'Matthew 5:9',
    reflection: 'Be an agent of reconciliation, humility, and peace in your jumuiya and classrooms.'
  },
  '10-07': {
    saintName: 'Our Lady of the Rosary',
    feastTitle: 'Memorial of Our Lady of the Rosary',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'The Rosary Confraternity',
    saintInfo: 'Instituted in thanksgiving for the intercession of Our Lady through the Holy Rosary in defending Christendom.',
    verse: 'Hail Mary, full of grace, the Lord is with thee. Blessed art thou among women.',
    reference: 'Luke 1:28',
    reflection: 'The Rosary is our spiritual weapon and bridge to the peace of Christ.'
  },
  '10-22': {
    saintName: 'Saint John Paul II',
    feastTitle: 'Optional Memorial of Saint John Paul II, Pope',
    rank: 'Optional Memorial',
    liturgicalColor: 'White',
    patronage: 'World Youth Day, young families',
    saintInfo: 'Pilgrim Pope who inspired millions of university students and youth worldwide, proclaiming: "Do not be afraid! Open wide the doors to Christ!"',
    verse: 'Do not be afraid! Open wide the doors for Christ!',
    reference: 'John 14:27',
    reflection: 'Cast aside fear and live your Catholic identity openly with boldness and charity.'
  },

  // November
  '11-01': {
    saintName: 'All Saints',
    feastTitle: 'Solemnity of All Saints',
    rank: 'Solemnity',
    liturgicalColor: 'White',
    patronage: 'All Humanity',
    saintInfo: 'Honoring all the holy men and women reigning with Christ in heaven, known and unknown, interceding for us.',
    verse: 'Blessed are the pure in heart, for they shall see God.',
    reference: 'Matthew 5:8',
    reflection: 'Holiness is not reserved for a chosen few; we are all called to be saints in our university life.'
  },
  '11-02': {
    saintName: 'All Souls (The Faithful Departed)',
    feastTitle: 'The Commemoration of All the Faithful Departed (All Souls)',
    rank: 'Commemoration',
    liturgicalColor: 'Violet',
    patronage: 'Souls in Purgatory',
    saintInfo: 'The Church universal prays with filial affection for our departed brothers and sisters undergoing purification.',
    verse: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
    reference: 'John 3:16',
    reflection: 'Pray for the faithful departed and remember the eternal significance of each soul.'
  },
  '11-03': {
    saintName: 'Saint Martin de Porres',
    feastTitle: 'Memorial of Saint Martin de Porres, Religious',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Social justice, racial harmony, public health',
    saintInfo: 'Dominican brother in Lima, Peru, known for his extraordinary humility, miraculous healing gifts, and tender care for the sick and marginalized.',
    verse: 'Learn to do good; seek justice, correct oppression; bring justice to the fatherless, plead the widow’s cause.',
    reference: 'Isaiah 1:17',
    reflection: 'True nobility before God is found in humble service and treating everyone as Christ.'
  },
  '11-10': {
    saintName: 'Saint Leo the Great',
    feastTitle: 'Memorial of Saint Leo the Great, Pope & Doctor of the Church',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Popes, musicians, peace',
    saintInfo: 'Defended the orthodox teaching of the two natures of Christ (divine and human) and protected Rome with moral authority.',
    verse: 'Christian, recognize your dignity and, now that you share in God’s own nature, do not return to your former base condition.',
    reference: '1 Peter 2:9',
    reflection: 'Remember your dignity as a baptized child of God in everything you say and do.'
  },
  '11-17': {
    saintName: 'Saint Elizabeth of Hungary',
    feastTitle: 'Memorial of Saint Elizabeth of Hungary, Religious',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Charities, bakers, homeless',
    saintInfo: 'Princess who renounced luxury to build hospitals and personally feed and nurse the poor and suffering.',
    verse: 'Truly, I say to you, as you did it to one of the least of these my brothers, you did it to me.',
    reference: 'Matthew 25:40',
    reflection: 'Share generously from what you have with those facing hardship on and off campus.'
  },
  '11-22': {
    saintName: 'Saint Cecilia',
    feastTitle: 'Memorial of Saint Cecilia, Virgin & Martyr',
    rank: 'Memorial',
    liturgicalColor: 'Red',
    patronage: 'Musicians, composers, choir singers',
    saintInfo: 'Patron saint of musicians and choir members, who sang praises to God in her heart even in the midst of martyrdom.',
    verse: 'Sing to the Lord a new song; make melody to him with the harp and the lyre.',
    reference: 'Psalm 98:1',
    reflection: 'Lift your voice and instruments in pure adoration of Jesus, remembering that singing is praying twice.'
  },
  '11-30': {
    saintName: 'Saint Andrew the Apostle',
    feastTitle: 'Feast of Saint Andrew, Apostle',
    rank: 'Feast',
    liturgicalColor: 'Red',
    patronage: 'Fishermen, Scotland, Greece',
    saintInfo: 'The first-called apostle who eagerly brought his brother Simon Peter to meet Jesus: "We have found the Messiah!"',
    verse: 'Andrew said to his brother Simon: "We have found the Messiah." And he brought him to Jesus.',
    reference: 'John 1:41-42',
    reflection: 'Introduce someone to Jesus this week by inviting them to Jumuiya fellowship or Sunday Mass.'
  },

  // December
  '12-03': {
    saintName: 'Saint Francis Xavier',
    feastTitle: 'Memorial of Saint Francis Xavier, Priest',
    rank: 'Memorial',
    liturgicalColor: 'White',
    patronage: 'Foreign missions, navigators',
    saintInfo: 'Jesuit pioneer and patron of Catholic missions who traveled tirelessly across Asia, bringing hundreds of thousands to baptism.',
    verse: 'What does it profit a man to gain the whole world, and forfeit his soul?',
    reference: 'Mark 8:36',
    reflection: 'Never trade your eternal soul and spiritual integrity for transient university popularity.'
  },
  '12-08': {
    saintName: 'The Immaculate Conception of the Blessed Virgin Mary',
    feastTitle: 'Solemnity of the Immaculate Conception of the Blessed Virgin Mary',
    rank: 'Solemnity',
    liturgicalColor: 'White',
    patronage: 'The Universal Church, United States, Kenya',
    saintInfo: 'Celebrating Mary preserved from original sin from the first moment of her conception by a singular grace of Almighty God.',
    verse: 'Hail, full of grace, the Lord is with you! Blessed are you among women.',
    reference: 'Luke 1:28',
    reflection: 'Strive for purity of mind, heart, and intention under Our Lady’s immaculate care.'
  },
  '12-25': {
    saintName: 'The Nativity of the Lord (Christmas)',
    feastTitle: 'Solemnity of the Nativity of the Lord',
    rank: 'Solemnity',
    liturgicalColor: 'White',
    patronage: 'All Mankind',
    saintInfo: 'The Word became flesh and dwelt among us! Celebrating the birth of our Savior in the humility of Bethlehem.',
    verse: 'For to us a child is born, to us a son is given; and the government shall be upon his shoulder, and his name shall be called Wonderful Counselor, Mighty God, Everlasting Father, Prince of Peace.',
    reference: 'Isaiah 9:6',
    reflection: 'Open your heart to receive the Infant Jesus anew as your personal Lord and Savior.'
  },
  '12-26': {
    saintName: 'Saint Stephen, the First Martyr',
    feastTitle: 'Feast of Saint Stephen, the First Martyr',
    rank: 'Feast',
    liturgicalColor: 'Red',
    patronage: 'Deacons, altar servers, bricklayers',
    saintInfo: 'First Christian deacon and proto-martyr who forgave his executioners while gazing into the open heavens.',
    verse: 'Lord Jesus, receive my spirit... Lord, do not hold this sin against them.',
    reference: 'Acts 7:59-60',
    reflection: 'Forgiveness is the highest expression of Christ’s presence in our hearts.'
  }
};

/**
 * Universal general day fallback generator for any day not explicitly in the primary saint lookup
 */
export function getLiturgicalDayForDate(targetDate: Date = new Date()): LiturgicalDay {
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  const y = targetDate.getFullYear();
  const monthDay = `${m}-${d}`;
  const dateKey = `${y}-${m}-${d}`;

  if (LITURGICAL_CALENDAR_DATABASE[monthDay]) {
    const data = LITURGICAL_CALENDAR_DATABASE[monthDay];
    return {
      dateKey,
      monthDay,
      ...data
    };
  }

  // Generative seasonal liturgical day based on Day of Week and Catholic Season
  const dayOfWeek = targetDate.getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const seasonalSaints: Array<{ name: string; info: string; patronage: string }> = [
    { name: 'Saint Jude Thaddeus', info: 'Apostle of hope and patron of impossible causes, reminding us that God makes a way where there seems to be no way.', patronage: 'Hopeless causes, desperate situations' },
    { name: 'Saint Gianna Beretta Molla', info: 'Catholic physician and mother who gave her life in heroic love for her unborn child.', patronage: 'Doctors, mothers, unborn children' },
    { name: 'Saint Padre Pio of Pietrelcina', info: 'Capuchin friar blessed with the stigmata, who taught: "Pray, hope, and don’t worry."', patronage: 'Confessors, youth, stress relief' },
    { name: 'Saint Teresa of Avila', info: 'Doctor of the Church and reformer who wrote: "Let nothing disturb you; all things are passing; God alone suffices."', patronage: 'Headaches, spiritual life' },
    { name: 'Saint Maximilian Kolbe', info: 'Franciscan priest who gave his life for a fellow prisoner in Auschwitz, a beacon of sacrificial charity.', patronage: 'Journalists, families' },
    { name: 'Saint Kateri Tekakwitha', info: 'The Lily of the Mohawks, living a life of extraordinary prayer, purity, and quiet joy.', patronage: 'Ecology, indigenous people' },
    { name: 'Saint John Henry Newman', info: 'Cardinal and champion of university education, teaching that knowledge must be animated by faith.', patronage: 'University students, scholars' },
    { name: 'Saint Bakhita of Sudan', info: 'African saint who overcame slavery through the freeing love of Christ, declaring: "I am definitively loved."', patronage: 'Sudan, human dignity, captives' }
  ];

  const saintIndex = (targetDate.getDate() + targetDate.getMonth() * 3) % seasonalSaints.length;
  const saint = seasonalSaints[saintIndex];

  const seasonalVerses = [
    { verse: 'Trust in the Lord with all your heart, and do not lean on your own understanding.', reference: 'Proverbs 3:5' },
    { verse: 'I can do all things through him who strengthens me.', reference: 'Philippians 4:13' },
    { verse: 'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures.', reference: 'Psalm 23:1-2' },
    { verse: 'Come to me, all who labor and are heavy laden, and I will give you rest.', reference: 'Matthew 11:28' },
    { verse: 'Seek first the kingdom of God and his righteousness, and all these things will be added to you.', reference: 'Matthew 6:33' },
    { verse: 'Be strong and courageous. Do not be frightened, for the Lord your God is with you wherever you go.', reference: 'Joshua 1:9' },
    { verse: 'Peace I leave with you; my peace I give to you. Not as the world gives do I give to you.', reference: 'John 14:27' }
  ];

  const verseObj = seasonalVerses[dayOfWeek];

  return {
    dateKey,
    monthDay,
    saintName: saint.name,
    feastTitle: `Commemoration of ${saint.name}`,
    rank: 'Optional Memorial',
    liturgicalColor: 'Green',
    patronage: saint.patronage,
    saintInfo: saint.info,
    verse: verseObj.verse,
    reference: verseObj.reference,
    reflection: `On this ${dayNames[dayOfWeek]}, ${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}, walk in the light of Christ and draw strength from the communion of saints.`
  };
}

/**
 * Returns all prominent saint celebrations and liturgical feasts for a given month
 */
export function getLiturgicalFeastsForMonth(year: number, monthZeroIndexed: number): LiturgicalDay[] {
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();
  const list: LiturgicalDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthZeroIndexed, day);
    const mStr = String(monthZeroIndexed + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const key = `${mStr}-${dStr}`;

    if (LITURGICAL_CALENDAR_DATABASE[key]) {
      list.push(getLiturgicalDayForDate(d));
    }
  }

  return list;
}

/**
 * Automatically inspects and synchronizes today's daily bread in Firestore if missing or outdated
 */
export async function autoSyncDailyBreadIfOutdated(): Promise<{ updated: boolean; data: LiturgicalDay }> {
  const today = new Date();
  const liturgicalDay = getLiturgicalDayForDate(today);

  try {
    const docRef = doc(db, 'control', 'daily_bread');
    const snap = await getDoc(docRef);

    let needsUpdate = false;

    if (!snap.exists()) {
      needsUpdate = true;
    } else {
      const currentData = snap.data();
      // If dateKey is missing, or does not match today's dateKey
      if (!currentData.dateKey || currentData.dateKey !== liturgicalDay.dateKey) {
        // Also check if updatedAt was on a previous calendar day
        if (currentData.updatedAt?.toDate) {
          const updatedDate = currentData.updatedAt.toDate();
          if (updatedDate.toDateString() !== today.toDateString()) {
            needsUpdate = true;
          }
        } else {
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      await setDoc(docRef, {
        verse: liturgicalDay.verse,
        reference: liturgicalDay.reference,
        saintName: liturgicalDay.saintName,
        saintInfo: liturgicalDay.saintInfo,
        feastTitle: liturgicalDay.feastTitle,
        liturgicalColor: liturgicalDay.liturgicalColor,
        rank: liturgicalDay.rank,
        reflection: liturgicalDay.reflection,
        patronage: liturgicalDay.patronage,
        dateKey: liturgicalDay.dateKey,
        autoGenerated: true,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return { updated: true, data: liturgicalDay };
    }

    return { updated: false, data: liturgicalDay };
  } catch (error) {
    console.warn("Auto-sync daily bread notice (handled):", error);
    return { updated: false, data: liturgicalDay };
  }
}

/**
 * Automatically populates this month's Saint Feasts, Memorials, and Mass celebrations into the Firestore events collection
 */
export async function autoPopulateSaintFeastsToEvents(
  year: number = new Date().getFullYear(),
  monthZeroIndexed: number = new Date().getMonth(),
  addedBy: string = 'Liturgical Calendar Engine'
): Promise<{ addedCount: number; feasts: LiturgicalDay[] }> {
  const feasts = getLiturgicalFeastsForMonth(year, monthZeroIndexed);
  let addedCount = 0;

  for (const feast of feasts) {
    try {
      const parts = feast.dateKey.split('-');
      const eventDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 9, 0, 0);

      // Also add to schedule collection for calendar view
      await addDoc(collection(db, 'schedule'), {
        title: feast.feastTitle,
        description: `Feast Commemoration of ${feast.saintName}. ${feast.saintInfo} Patron of ${feast.patronage}. Scripture: ${feast.reference} — "${feast.verse}"`,
        date: Timestamp.fromDate(eventDate),
        location: 'Zetech University Chapel',
        type: (feast.rank === 'Solemnity' || feast.rank === 'Feast') ? 'Mass' : 'Other',
        downloadUrl: '',
        addedBy: addedBy,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, 'events'), {
        title: `${feast.feastTitle}`,
        description: `Saint Feast Day & Liturgical Commemoration. ${feast.saintInfo} Patronage: ${feast.patronage}. Scripture Reading: ${feast.reference} — "${feast.verse}"`,
        date: Timestamp.fromDate(eventDate),
        location: 'Zetech University Chapel & Campus Sanctuary',
        type: feast.rank === 'Solemnity' ? 'Mass' : 'Other',
        liturgicalColor: feast.liturgicalColor,
        rank: feast.rank,
        saintName: feast.saintName,
        scriptureRef: feast.reference,
        isAutoLiturgical: true,
        addedBy: addedBy,
        createdAt: serverTimestamp()
      });
      addedCount++;
    } catch (err) {
      console.warn("Failed to add feast to events/schedule:", feast.feastTitle, err);
    }
  }

  return { addedCount, feasts };
}
