import Head from "next/head";
import { PrismicLink, PrismicText } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";
import * as prismicH from "@prismicio/helpers";

import { createClient } from "../prismicio";
import { Layout } from "../components/Layout";
import { Bounded } from "../components/Bounded";
import { Heading } from "../components/Heading";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const findFirstImage = (slices) => {
  const imageSlice = slices.find((slice) => slice.slice_type === "image");

  if (imageSlice && prismicH.isFilled.image(imageSlice.primary.image)) {
    return imageSlice.primary.image;
  }
};

const getExcerpt = (slices) => {
  const text = slices
    .filter((slice) => slice.slice_type === "text")
    .map((slice) => prismicH.asText(slice.primary.text))
    .join(" ");

  const excerpt = text.substring(0, 300);

  if (text.length > 300) {
    return excerpt.substring(0, excerpt.lastIndexOf(" ")) + "…";
  } else {
    return excerpt;
  }
};

const Article = ({ article }) => {
  const featuredImage =
    (prismicH.isFilled.image(article.data.featuredImage) &&
      article.data.featuredImage) ||
    findFirstImage(article.data.slices);
  const date = prismicH.asDate(
    article.data.publishDate || article.first_publication_date
  );
  const excerpt = getExcerpt(article.data.slices);

  return (
    <li className="grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-8">
      <PrismicLink document={article} tabIndex="-1">
        <div className="aspect-w-4 aspect-h-3 relative bg-gray-100">
          {prismicH.isFilled.image(featuredImage) && (
            <PrismicNextImage
              field={featuredImage}
              layout="fill"
              className="object-cover"
            />
          )}
        </div>
        <p>hier</p>
      </PrismicLink>
      <div className="grid grid-cols-1 gap-3 md:col-span-2">
        <Heading as="h2">
          <PrismicLink document={article}>
            <PrismicText field={article.data.title} />
          </PrismicLink>
        </Heading>
        <p className="font-serif italic tracking-tighter text-slate-500">
          {dateFormatter.format(date)}
        </p>
        {excerpt && (
          <p className="font-serif leading-relaxed md:text-lg md:leading-relaxed">
            {excerpt}
          </p>
        )}
      </div>
    </li>
  );
};

const getAssortimentsByCategory = (id, assortiments) => {
  const assortimentsByCategory = [];
  assortiments.forEach((assortiment) => {
    if(assortiment.data.category.id === id) {
      assortimentsByCategory.push(assortiment)
    }
  });
  return({
    assortimentsByCategory,
  })
}

const getProductsByAssortiment = (assortiments, products) => {
  const assortimentOverviewItems = [];
  assortiments.forEach((assortiment) => {
    const assortimentOverviewItem = {
      title: assortiment.data.name,
      products: [],
    };
    products.forEach((product) => {
      if (product.data.assortiment.id === assortiment.id) {
        assortimentOverviewItem.products.push(product);
      }
    })
    assortimentOverviewItems.push(assortimentOverviewItem)
  })
  return({
    assortimentOverviewItems,
  })
}

const Overview = ({ category, assortiments, products }) => {
  const { assortimentsByCategory } = getAssortimentsByCategory(category.id, assortiments);
  const { assortimentOverviewItems } = getProductsByAssortiment(assortimentsByCategory, products);
  console.log(assortimentOverviewItems);
  return(
    <div className="mb-12">
      <h2 className="font-bold leading-tight text-gray-900 text-5xl">{category.data.name}</h2>
      {assortimentOverviewItems.map((productByAssortiment) => (
          <div className="my-8">
          <h3 className="font-bold leading-tight text-gray-900 text-2xl">{productByAssortiment.title}</h3>
          <ul>
          {productByAssortiment.products.map((product) => (
            <li className="leading-loosex text-gray-900">{ product.data.name }</li>
          ))}
        </ul>
        </div>
      ))}
    </div>
  )
}

const Index = ({ articles, categories, assortiments, products, navigation, settings }) => {
  return (
    <Layout
      withHeaderDivider={true}
      navigation={navigation}
      settings={settings}
    >
      <Head>
        <title>{prismicH.asText(settings.data.name)}</title>
      </Head>
      <Bounded size="widest">

        <ul className="grid grid-cols-1 gap-16">
          { categories.map((category) => (
            <li>
              <Overview category={category} assortiments={assortiments} products={products} />
            </li>
          )) }
        </ul>
        {/* <ul className="grid grid-cols-1 gap-16">
          {articles.map((article) => (
            <Article key={article.id} article={article} />
          ))}
        </ul> */}
      </Bounded>
    </Layout>
  );
};

export default Index;

export async function getStaticProps({ previewData }) {
  const client = createClient({ previewData });

  const articles = await client.getAllByType("article", {
    orderings: [
      { field: "my.article.publishDate", direction: "desc" },
      { field: "document.first_publication_date", direction: "desc" },
    ],
  });
  const categories = await client.getAllByType("category", {
    orderings: [
      // { field: "my.category.publishDate", direction: "desc" },
      { field: "document.first_publication_date", direction: "desc" },
    ],
  });
  const assortiments = await client.getAllByType("assortiment", {
    orderings: [
      // { field: "my.category.publishDate", direction: "desc" },
      { field: "document.first_publication_date", direction: "desc" },
    ],
  });
  const products = await client.getAllByType("product", {
    orderings: [
      // { field: "my.category.publishDate", direction: "desc" },
      { field: "document.first_publication_date", direction: "desc" },
    ],
  });

  const navigation = await client.getSingle("navigation");
  const settings = await client.getSingle("settings");

  return {
    props: {
      articles,
      categories,
      assortiments,
      products,
      navigation,
      settings,
    },
  };
}
