<template lang="pug">

</template>

<script>
export default {
  props: {},
  data: () => ({}),
  methods: {},
  computed: {
    query() {
      return this.$route.query;
    },
  },
  watch: {},
  mounted() {
    let sharedCoins = Object.keys(this.query).map((k) => ({
      c: k.toUpperCase(),
      v: this.query[k],
      p: 0,
    }));
    let data = [{ date: new Date(), coins: sharedCoins, cash: 0 }];
    localStorage.setItem("dw-history", JSON.stringify(data));
    this.$router.push("/");
  },
};
</script>

<style></style>
