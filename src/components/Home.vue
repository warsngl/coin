<template lang="pug">
button.share(@click='share') Share
.line
  label(for='add') Add coin
  input#add.line__price(v-model='coin' @keydown.enter='addCoin')
  button(@click='addCoin') +
ul.ul
  li.line(v-for='c,i in coins')
    label.flex.items-center(:for='c.c') {{c.c}}
      span.cursor-pointer(class='text-xs ml-2 text-red-600 hover:text-white' @click='remove(i)') x
    .line__price
      input(v-model='c.v' :id='c.c' type='Number')
      span {{c.p}}
.line
  p(ref='cash') Your cash: {{Math.trunc(cash)}}
  button.mr-1
    img(src='../assets/chart.png' @click='isChart=!isChart')
  p.underline.italic.cursor-pointer(@click='refresh') refresh
.chart(v-if='isChart')
  Line( id="my-chart-id" :data="chartData" :options='chartOptions')
div(v-else)
  ul.ul(v-if="typeof errors==='object'")
    li(v-for='e in errors' :key='e.coin')
      p {{e.coin}}: {{e.error}}
  p(v-if="typeof errors==='string'") {{errors}}
  ul.ul(v-if='history.length>0')
    li.line.w-full.cursor-pointer(
      v-for='h in history',
      :key='h.date',
      class="hover:underline",
      :class="changeInBalance(h.date).at(0)=='-'?'text-red':'text-green'" @click='backToDate(h.date)'
    )
      p.text-sm {{formatDate(h.date)}}
      span.ml-auto {{Math.trunc(h.cash) || 0}} {{changeInBalance(h.date)}}
      span(class='cursor-pointer text-xs ml-2 text-red-600 hover:text-white' @click.self='clear(h.date)') x
</template>

<script>
import { Line } from "vue-chartjs";
import {
  Chart,
  LinearScale,
  PointElement,
  LineElement,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
Chart.register(PointElement, LineElement, CategoryScale, LinearScale, Tooltip, Legend);
export default {
  data: () => ({
    coin: "",
    coins: [],
    cash: 0,
    history: [],
    otherErrors: [],
    isChart: true,
  }),
  methods: {
    async refresh() {
      this.cash = 0;
      this.otherErrors = [];
      this.errors = [];
      await Promise.all(
        this.coins.map(async (c, idx) => {
          await fetch(
            `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${c.c}&tsyms=RUB&api_key=b5a5b68758c1e3428691ea0f0fcac1dfe98df8c99dba00cfac673e16b887c436`
          )
            .then((res) => res.json())
            .then((json) => {
              this.cash += +json[c.c].RUB * c.v;
              this.coins[idx].p = +json[c.c].RUB;
            })
            .catch(async (e) => {
              console.log(e);
              this.otherErrors.push({ coin: c.c, error: e + "" });
              await fetch(
                `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${c.c}&tsyms=BTC&api_key=b5a5b68758c1e3428691ea0f0fcac1dfe98df8c99dba00cfac673e16b887c436`
              )
                .then((res) => res.json())
                .then(async (json) => {
                  let inBTC = +json[c.c].BTC * c.v;
                  await fetch(
                    `https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC&tsyms=RUB&api_key=b5a5b68758c1e3428691ea0f0fcac1dfe98df8c99dba00cfac673e16b887c436`
                  )
                    .then((res) => res.json())
                    .then((json) => {
                      this.cash += +json.BTC.RUB * inBTC;
                      this.coins[idx].p = +json.BTC.RUB * inBTC;
                    });
                });
            });
        })
      ).finally(() => {
        this.history.push({
          date: new Date(),
          // coins: JSON.parse(JSON.stringify(this.coins)),
          coins: this.coins,
          cash: this.cash,
        });
        localStorage.setItem("dw-history", JSON.stringify(this.history));
      });
    },
    addCoin() {
      if (this.coin.length > 0) {
        this.$refs.cash.focus();
        this.coins.push({ c: this.coin.toUpperCase(), v: 0 });
        this.coin = "";
        this.errors = [];
      } else {
        this.errors = "Enter coin name";
      }
    },
    backToDate(d) {
      let x = this.history.find((h) => h.date == d);
      x
        ? ((this.coins = JSON.parse(JSON.stringify(x.coins))), (this.otherErrors = ""))
        : (this.otherErrors = "Cannot find this date");
      console.log(d, x);
    },
    remove(idx) {
      this.coins = this.coins.filter((c, i) => i !== idx);
    },
    clear(d) {
      this.history = this.history.filter((h) => h.date !== d);
      localStorage.setItem("dw-history", JSON.stringify(this.history));
    },
    formatDate(h) {
      const d = new Date(h);
      let m = d.getMinutes();
      return (
        d.getMonth() +
        1 +
        "." +
        d.getDate() +
        "/" +
        d.getHours() +
        ":" +
        (m < 10 ? "0" + m : m)
      );
    },
    changeInBalance(d) {
      // debugger;
      if (d) {
        let i = this.history.findIndex((h) => d == h.date);
        if (i == 0) return "";
        let p = ((this.history[i].cash / this.history[i - 1].cash - 1) * 100).toFixed(2);
        return p > 0 ? "+" + p + "%" : p + "%";
      } else {
        return "";
      }
    },
    share() {
      let sharedData = this.coins.map((c) => c.c + "=" + c.v).join("&");
      console.log(sharedData);
      navigator.clipboard.writeText("https://warsngl.github.io/coin/copy?" + sharedData);
    },
  },
  watch: {},
  computed: {
    errors: {
      get() {
        return (
          (this.otherErrors.length > 0 && this.otherErrors) ||
          (this.coins.length == 0 && "No saved coins yet..") ||
          (this.history.length == 0 && "No history yet..")
        );
      },
      set(val) {
        this.otherErrors = val;
      },
    },
    chartData() {
      let labels = this.history.map((h) => this.formatDate(h.date));
      // let coins=this.history[0].coins.map(c=>c.c)
      // let data=coins.map(c=>)
      let datasets = [
        {
          label: "1",
          backgroundColor: "#000",
          borderColor: "#fa0",
          color: "#fff",
          data: this.history.map((h) => h.cash),
        },
      ];
      return { labels, datasets };
    },
    chartOptions() {
      return {
        responsive: true,
        // maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              color: "#fff",
              // borderColor: "red",
              font: {
                size: 8,
              },
              callback(value, index, ticks) {
                return this.getLabelForValue(value).split("/")[0];
              },
            },
          },
          y: {
            // min: 0,
            // max: 100,
            ticks: {
              color: "#fff",
              borderColor: "green",
              // stepSize: 50,
              font: {
                size: 8,
              },
            },
          },
        },
        plugins: {
          // tooltip: {
          //   callbacks: {
          //     label: function (context) {
          //       console.log(context)
          //       return context;
          //     },
          //   },
          // },
          legend: {
            labels: {
              usePointStyle: true,
              color: "#fff",
            },
          },
        },
      };
    },
  },
  mounted() {
    const history = JSON.parse(localStorage.getItem("dw-history"));
    history?.length > 0 &&
      ((this.history = history),
      (this.coins = history.at(-1).coins),
      (this.cash = history.at(-1).cash));
  },
  components: { Line },
};
</script>

<style>
.ul {
  @apply max-h-[200px] overflow-y-auto;
}
.ul::-webkit-scrollbar {
  @apply bg-transparent w-[3px];
}
.ul::-webkit-scrollbar-thumb {
  @apply bg-pink-800;
}
input {
  @apply rounded-lg pl-2 outline-none text-purple-800 w-[64px];
}
.line {
  @apply flex justify-between items-center w-[260px] mb-2 text-right;
}
.line__price {
  @apply w-[160px] flex justify-between;
}
.chart {
  @apply w-[260px] h-[200px];
}
.share {
  @apply fixed bottom-2 left-2;
}
</style>
