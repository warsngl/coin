<template lang="pug">
.line
  label(for='add') Add coin
  input#add.line__price(v-model='coin' @keydown.enter='addCoin')
.coins
  .line(v-for='c,idx in coins')
    label(:for='c.c') {{c.c}}
      span(class='text-xs ml-2 text-red-600 align-middle hover:text-white' @click='remove(idx)') x
    .line__price
      input(v-model='c.v' :id='c.c' type='Number')
      span {{c.p}}
.line
  p(ref='cash') Your cash: {{Math.trunc(cash)}}
  p.underline.italic.cursor-pointer(@click='refresh') refresh
ul.history(v-if="typeof errors==='object'")
  li(v-for='e in errors' :key='e.coin')
    p {{e.coin}}: {{e.error}}
p(v-if="typeof errors==='string'") {{errors}}
ul.history(v-if='errors.length==0')
  li.line(v-for='chunk,idx in history')
    p {{formatDate(chunk.date)}}
    p {{Math.trunc(chunk.cash) || 0}} {{calcDif(idx)}}
      span(class='text-xs ml-2 text-red-600 align-middle hover:text-white' @click='clear(idx)') x
</template>

<script>
export default {
  data: () => ({
    coin: "",
    coins: [],
    cash: 0,
    history: [],
    otherErrors: [],
  }),
  methods: {
    async refresh() {
      this.cash = 0;
      this.otherErrors = [];
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
      );
      this.history.push({
        date: new Date(),
        wallet: this.coins,
        cash: this.cash,
      });
      localStorage.setItem("dw-history", JSON.stringify(this.history));
    },
    addCoin() {
      if (this.coin.length > 0) {
        this.$refs.cash.focus();
        this.coins.push({ c: this.coin.toUpperCase(), v: 0 });
        localStorage.setItem("dw-coins", JSON.stringify(this.coins));
        this.coin = "";
        this.errors = "";
      } else {
        this.errors = "Enter coin name";
      }
    },
    remove(idx) {
      this.coins = this.coins.filter((c, i) => i !== idx);
    },
    clear(idx) {
      this.history = this.history.filter((h, i) => i !== idx);
    },
    formatDate(h) {
      const d = new Date(h);
      let m = d.getMinutes();
      return (
        d.getDate() +
        "." +
        (d.getMonth() + 1) +
        "-" +
        d.getHours() +
        ":" +
        (m < 10 ? "0" + m : m)
      );
    },
    calcDif(idx) {
      if (idx == 0) {
        return "";
      } else {
        let p =
          (this.history[idx].cash / this.history[idx - 1].cash - 1).toFixed(4) *
          100;
        return p > 0 ? "+" + p + "%" : p + "%";
      }
    },
  },
  watch: {
    coins: {
      handler(val) {
        localStorage.setItem("dw-coins", JSON.stringify(val));
      },
      deep: true,
    },
    history: {
      handler(val) {
        localStorage.setItem("dw-history", JSON.stringify(val));
      },
      deep: true,
    },
  },
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
  },
  mounted() {
    const history = JSON.parse(localStorage.getItem("dw-history"));
    history && (this.history = history);
    const coins = JSON.parse(localStorage.getItem("dw-coins"));
    coins && (this.coins = coins);
  },
};
</script>

<style>
.coins {
  @apply max-h-[200px] overflow-y-auto;
}
.coins::-webkit-scrollbar {
  @apply bg-transparent w-[3px];
}
.coins::-webkit-scrollbar-thumb {
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
.history {
  @apply max-h-[300px] overflow-y-auto;
}
</style>
