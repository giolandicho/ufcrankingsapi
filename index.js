import axios from 'axios';
import express from 'express';
import * as Cheerio from 'cheerio';

const PORT = process.env.PORT || 8000;
const app = express();
const rankings = [];
class Ranking{
    constructor(weightClass){
        this.weightClass = weightClass;
        this.fighters = []
    }
};

const setWeightClass = () => {
    const pound_for_pound = new Ranking("Pound for Pound");
    const flyweight = new Ranking("Flyweight")
    const bantamweight = new Ranking("Bantamweight")
    const featherweight = new Ranking("Featherweight")
    const lightweight = new Ranking("Lightweight")
    const welterweight = new Ranking("Welterweight")
    const middleweight = new Ranking("Middleweight")
    const light_heavyweight = new Ranking("Light Heavyweight")
    const heavyweight = new Ranking("Heavyweight")
    const womens_pound_for_pound = new Ranking("Women's Pound for Pound")
    const womens_strawweight = new Ranking("Women's Strawweight")
    const womens_flyweight = new Ranking("Women's Flyweight")
    const womens_bantamweight = new Ranking("Women's Bantamweight")
    const womens_featherweight = new Ranking("Women's Featherweight")
    rankings.push(pound_for_pound,
         flyweight, 
         bantamweight, 
         featherweight,
         lightweight,
         welterweight,
         middleweight,
         light_heavyweight,
         heavyweight,
         womens_pound_for_pound,
         womens_strawweight,
         womens_flyweight,
         womens_bantamweight,
         womens_featherweight)
}

const getRanking = (index) => {
    if(30 < index){
        return getRanking(index-16);
    }
    else if(index < 15){
        return index+1;
    }
    else if(15 <= index && index <= 30){
        return index - 15;
    }
}
const getWeightClass = (index) => {
    if(index < 15) return "Pound for Pound"
    else if(15 <= index && index < 31) return "Flyweight"
    else if(31 <= index && index < 47) return "Bantamweight"
    else if(47 <= index && index < 63) return "Featherweight"
    else if(63 <= index && index < 79) return "Lightweight"
    else if(79 <= index && index < 95) return "Welterweight"
    else if(95 <= index && index < 111) return "Middleweight"
    else if(111 <= index && index < 127) return "Light Heavyweight"
    else if(127 <= index && index < 143) return "Heavyweight"
    else if(143 <= index && index < 158) return "Women's Pound for Pound"
    else if(158 <= index && index < 174) return "Women's Strawweight"
    else if(174 <= index && index < 190) return "Women's Flyweight"
    else if(190 <=index && index < 206) return "Women's Bantamweight"
    else if(206 <= index) return "Women's Featherweight"
}

axios.get('https://www.ufc.com/rankings')
    .then(res => {
        setWeightClass();
        const html = res.data
        const $ = Cheerio.load(html);
        $('.view-grouping a[href]').each((index, element) =>{
           const weight = getWeightClass(index); 
           if(index > 142){
               index = index - 143;
           } 
           const url =  `https://www.ufc.com${$(element).attr('href')}`
           const athleteInfo = $(element).attr('href').split("/");
           const name = athleteInfo[2].split("")
           for(let i = 0; i < name.length; i++){
               if(name[i] === "-"){
                   name.splice(i,1," ")
               }
           }
           const fullName = name.join('').toUpperCase();
           let fighter_ranking = getRanking(index).toString();
           if(fighter_ranking === "0"){
               fighter_ranking = "CHAMPION";
           }
           for(let i = 0; i < rankings.length; i++){
               if(rankings[i].weightClass === weight){
                    rankings[i].fighters.push({   
                    fighter_ranking,   
                    fullName,
                    url
                   })
               }
           }
        })
    }).catch((e) =>{
        console.log(e)
    })
 



app.get('/', (req, res) => {
    res.json(rankings)
})

app.listen(PORT, () =>{
    console.log(`server running on port ${PORT}`)
})
