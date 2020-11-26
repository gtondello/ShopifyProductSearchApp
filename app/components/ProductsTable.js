/*
 * Demo Products selection table.
 * Features:
 * - Sorting by title, inventory, type, vendor
 * - Text-based filtering
 * - Multiple selection
 * - Row rendering is customized to display product descriptions on a second line
 */
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { Fragment } from 'react';
import {
    Card,
    Stack,
    DataTable,
    Thumbnail,
    Checkbox,
    Button,
    Filters,
    SkeletonBodyText,
    Tooltip,
    SettingToggle,
    TextStyle
} from '@shopify/polaris';
import { Redirect } from '@shopify/app-bridge/actions';
import { Context, Loading } from '@shopify/app-bridge-react';

const GET_ALL_PRODUCTS = gql`
  query getProducts($query: String, $sortKey: ProductSortKeys!, $reverse: Boolean) {
    products(first: 50, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        node {
          id
          title
          descriptionHtml
          productType
          vendor
          totalInventory
          totalVariants
          tags
          images(first: 1) {
            edges {
              node {
                originalSrc
                altText
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * This function customizes the default product rendering to optionally display
 * a second row with each product's description.
 * Props:
 * - All those from DataTable
 * - showDescriptions: boolean
 * - descriptions: array
 */
function DataTableWithProductDescription(props) {
    const DataTableInner = DataTable(props).type;
    const table = new DataTableInner(props);
    const parentDefaultRenderRow = table.defaultRenderRow;
    table.defaultRenderRow = (row, index) => {
        const defaultRow = parentDefaultRenderRow(row, index);
        const descriptionRow = (table.props.showDescriptions &&
            <tr key={`row-${index}-desc`} className="Polaris-DataTable__TableRow">
                <td key={`row-${index}-desc-col-1`} className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignMiddle"></td>
                <td key={`row-${index}-desc-col-2`} className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignMiddle"></td>
                <td key={`row-${index}-desc-col-3`} className="Polaris-DataTable__Cell Polaris-DataTable__Cell--verticalAlignMiddle" colSpan={row.length-2}>
                    <div dangerouslySetInnerHTML={{__html: table.props.descriptions[index]}} />
                </td>
            </tr>
        );
        return (<Fragment key={`frag-${index}-desc`}>{defaultRow}{descriptionRow}</Fragment>);
    };
    return table;
}

/**
 * The main Product listing/selection table.
 * Props:
 * - state: Object
 * - onProductsSelected: function(array)
 */
class ProductsTable extends React.Component {
    static contextType = Context;
    constructor(props) {
        super(props);
        this.products = [];
        this.state = this.props.state != null ? this.props.state : {
            selectedItems: [],
            queryValue: null,
            query: null,
            sortKey: "TITLE",
            reverse: false,
            sortDirection: "ascending",
            sortColumnIndex: 2,
            showDescriptions: true
        };
        this.queryTimerID = null;
    }

    /*** RENDER METHOD ***/
    render() {
        const app = this.context;
        const redirectToProduct = (gid) => {
            const redirect = Redirect.create(app);
            const id = gid.substring(gid.lastIndexOf("/")+1);
            redirect.dispatch(
                Redirect.Action.ADMIN_SECTION,
                {
                    name: Redirect.ResourceType.Product,
                    resource: {
                        id: id
                    }
                }
            );
        };
        return (
            <Card>
                <Card.Section>
                    <Filters
                        queryValue={this.state.queryValue}
                        filters={[]}
                        onQueryChange={this.handleFiltersQueryChange}
                        onQueryClear={this.handleQueryValueRemove}
                    />
                </Card.Section>
                <Query
                    query={GET_ALL_PRODUCTS}
                    variables={{
                        query: this.state.query,
                        sortKey: this.state.sortKey,
                        reverse: this.state.reverse
                    }}
                >
                    {({ data, loading, error }) => {
                        if (loading) return this.loadingLayout();
                        if (error) { console.log(error); return <div>{error.message}</div> };
                        //console.log(data);
                        this.products = data.products.edges.map(edge => edge.node);
                        const rows = this.products.map(product => [
                            <Checkbox
                                label={`Select ${product.title}`}
                                labelHidden={true}
                                id={product.id}
                                checked={this.state.selectedItems.includes(product.id)}
                                onChange={this.handleSelection}
                            />,
                            <Thumbnail
                                source={
                                    product.images.edges[0]
                                        ? product.images.edges[0].node.originalSrc
                                        : ''
                                }
                                alt={
                                    product.images.edges[0]
                                        ? product.images.edges[0].node.altText
                                        : ''
                                }
                                size="small"
                            />,
                            <Button plain onClick={() => redirectToProduct(product.id)}><TextStyle variation="strong">{product.title}</TextStyle></Button>,
                            <span>
                                {product.totalInventory > 0 ? product.totalInventory : <TextStyle variation="negative">{product.totalInventory}</TextStyle>} in stock
                                {product.totalVariants > 1 ? ` for ${product.totalVariants} variants` : null}
                            </span>,
                            product.productType,
                            product.vendor,
                            product.tags.length > 0 ? product.tags.join(', ') : ''
                        ]);
                        const descriptions = this.products.map(product => product.descriptionHtml);
                        return this.dataTableLayout(rows, descriptions);
                    }}
                </Query>
            </Card>
        );
    }

    /*** STATE/LAYOUT METHODS */
    loadingLayout() {
        return (
            <Fragment>
                <Loading />
                <Card.Section>
                    <SkeletonBodyText lines={2} />
                </Card.Section>
                <Card.Section>
                    <SkeletonBodyText lines={2} />
                </Card.Section>
                <Card.Section>
                    <SkeletonBodyText lines={2} />
                </Card.Section>
            </Fragment>
        );
    }
    dataTableLayout(rows, descriptions) {
        return (
            <div className="data-table">
                <SettingToggle
                    action={{
                        content: this.state.showDescriptions ? 'Hide Descriptions' : 'Show Descriptions',
                        onAction: this.toggleShowDescriptions,
                    }}
                    enabled={this.state.showDescriptions}
                >
                    {this.state.selectedItems.length == 0 ?
                        `Showing ${descriptions.length} ${descriptions.length > 1 ? 'products' : 'product'}.` :
                        `${this.state.selectedItems.length} of ${descriptions.length} ${descriptions.length > 1 ? 'products' : 'product'} selected.`
                    }<br/>
                    Product descriptions are {this.state.showDescriptions ? 'being displayed below each product row' : 'hidden'}.
                </SettingToggle>
                <DataTableWithProductDescription
                    columnContentTypes={[
                        'text',
                        'text',
                        'text',
                        'text',
                        'text',
                        'text',
                        'text'
                    ]}
                    headings={[
                        <Tooltip content="Select all products" preferredPosition="above">
                            <Button
                                size="slim"
                                disclosure
                                onClick={() => this.handleSelectAll(!(this.state.selectedItems.length == this.products.length))}
                            >
                                <Checkbox
                                    label="Select all Products"
                                    labelHidden={true}
                                    id="selectAllProducts"
                                    checked={this.isSelectAll()}
                                    onChange={this.handleSelectAll}
                                />
                            </Button>
                        </Tooltip>,
                        '',
                        'Product',
                        'Inventory',
                        'Type',
                        'Vendor',
                        'Tags'
                    ]}
                    rows={rows}
                    descriptions={descriptions}
                    verticalAlign="middle"
                    sortable={[false, false, true, true, true, true, false]}
                    defaultSortDirection={this.state.sortDirection}
                    initialSortColumnIndex={this.state.sortColumnIndex}
                    showDescriptions={this.state.showDescriptions}
                    onSort={this.handleSort}
                />
                <Card.Section>
                    <Stack>
                        <Stack.Item fill>
                            {this.state.selectedItems.length == 0 ?
                                'Please select some products to continue' :
                                `${this.state.selectedItems.length} of ${descriptions.length} ${descriptions.length > 1 ? 'products' : 'product'} selected`
                            }
                        </Stack.Item>
                        <Stack.Item>
                            <Button primary disabled={this.state.selectedItems.length == 0} onClick={this.handleContinue}>Continue &gt;</Button>
                        </Stack.Item>
                    </Stack>
                </Card.Section>
            </div>
        );
    }
    isSelectAll() {
        if (this.state.selectedItems.length == 0) {
            return false;
        } else if (this.state.selectedItems.length == this.products.length) {
            return true;
        } else {
            return "indeterminate";
        }
    }
    updateQuery() {
        this.setState({ query: this.state.queryValue });
    }

    /*** EVENT HANDLERS ***/
    handleFiltersQueryChange = (value) => {
        if (this.queryTimerID != null) {
            clearTimeout(this.queryTimerID);
            this.queryTimerID = null;
        }
        this.queryTimerID = setTimeout(
            () => {
                this.queryTimerID = null;
                this.updateQuery();
            },
            500
        );
        this.setState({ queryValue: value });
    };
    handleQueryValueRemove = () => {
        this.setState({ queryValue: null });
        setTimeout(() => this.updateQuery(), 100);
    };
    handleSort = (index, direction) => {
        let sortKey = "TITLE";
        switch (index) {
            case 3:
                sortKey = "INVENTORY_TOTAL";
                break;
            case 4:
                sortKey = "PRODUCT_TYPE";
                break;
            case 5:
                sortKey = "VENDOR";
                break;
            default:
                sortKey = "TITLE";
        }
        const reverse = (direction == "descending");
        this.setState({
            sortKey: sortKey,
            reverse: reverse,
            sortColumnIndex: index,
            sortDirection: direction
        });
    };
    handleSelection = (newChecked, id) => {
        if (newChecked) {
            this.setState({ selectedItems: this.state.selectedItems.concat([id]) });
        } else {
            this.setState({ selectedItems: this.state.selectedItems.filter(item => item != id) });
        }
    };
    handleSelectAll = (newChecked) => {
        if (newChecked) {
            this.setState({ selectedItems: this.products.map(product => product.id) });
        } else {
            this.setState({ selectedItems: [] });
        }
    };
    toggleShowDescriptions = () => {
        this.setState({ showDescriptions: !this.state.showDescriptions });
    }
    handleContinue = () => {
        if (this.props.onProductsSelected) {
            const selectedProducts = this.products.filter((product) => this.state.selectedItems.indexOf(product.id) != -1);
            this.props.onProductsSelected(selectedProducts, this.state);
        }
    }
}

export default ProductsTable;