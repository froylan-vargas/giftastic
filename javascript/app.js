$(document).ready(function () {

    categories = [
        'bored',
        'joy',
        'love',
        'disgust',
        'anxiety',
        'relax',
        'jealousy',
        'anger',
        'disappointment',
        'pain',
    ];

    var maxGifsRequest = 10;

    function start() {
        renderButtons();
    }

    //Create elements
    function renderButtons() {
        categories.forEach(category => {
            createButton(category);
        });
    }

    function appendGiftComponent(gif) {
        var gifComponents = $("#gifComponents");
        gifComponents.prepend(createGifComponent(gif));
    }

    function createGifComponent(gif) {
        const { rating, image, iconsDiv } = createGiftComponentElements(gif);
        return $("<div>")
            .addClass("gifComponent col-6 col-sm-4 col-md-3")
            .append( rating, image, iconsDiv);
    }

    function createGiftComponentElements(gif) {
        //var title = $('<p>').text(`Title:${gif.title}`);
        var rating = $('<p>').text(`Rating:${gif.rating}`);
        var image = createGifImgElement(gif);
        var iconsDiv = createIconsDiv();
        return { rating, image, iconsDiv };
    }

    function createGifImgElement(gif) {
        return $('<img>')
            .attr("src", gif.images.fixed_height_still.url)
            .attr("alt", "gif")
            .attr("data-state", "still")
            .attr("data-still", gif.images.fixed_height_still.url)
            .attr("data-animate", gif.images.downsized.url)
            .on('click', gifClickHandler)
    }

    function createIconsDiv() {
        var iconsDiv = $('<div>');
        const { favoriteIcon, downloadIcon, copyIcon } = createIconElements();
        iconsDiv.append(favoriteIcon, downloadIcon, copyIcon);
        return iconsDiv;
    }

    function createIconElements() {
        var favoriteIcon = $('<i>').addClass("icon far fa-heart");
        var downloadIcon = $('<i>').addClass("icon far fa-download");
        var copyIcon = $('<i>').addClass("icon far fa-copy");
        return { favoriteIcon, downloadIcon, copyIcon };
    }

    function createButton(category) {
        var categoryButton = $("<button>")
            .addClass("category-button")
            .attr("data-category", category)
            .text(category)
            .on('click', categoryClickHandler);
        $("#buttons-view").append(categoryButton);
    }

    //Handlers
    function categoryClickHandler() {
        $("#gifComponents").empty();
        var category = $(this).attr("data-category");
        const queryUrl = createGiphyUrl(category);
        giphyCall(queryUrl);
    }

    function addCategoryHandler(event) {
        event.preventDefault();
        var category = $("#category-input").val().trim();
        if (category.length) {
            categories.push(category);
            createButton(category);
            $("#category-input").val("");
        }
    };

    function gifClickHandler() {
        var gif = $(this);
        var gifState = gif.attr("data-state");
        switchGifState(gifState,gif);
    }

    //Helpers
    function switchGifState(gifState, gif){
        var attributeFilter = gifState === "still" ? "animate" : "still";
        var src = gif.attr(`data-${attributeFilter}`);
        gif.attr({src});
        gif.attr("data-state", attributeFilter);
    }


    //GiphyAPI
    function createGiphyUrl(category) {
        const giphyUrl = "https://api.giphy.com/v1/gifs/search?";
        const key = "dc6zaTOxFJmzC";
        return `${giphyUrl}api_key=${key}&q=${category}&rating=g&limit=${maxGifsRequest}`;
    }

    function giphyCall(queryUrl) {
        $.ajax({
            url: queryUrl,
            method: 'GET'
        }).then(giphyResponseHandler);
    }

    function giphyResponseHandler(gifs) {
        gifs.data.forEach(gif => {
            appendGiftComponent(gif);
        });
    }

    //Bindings
    $("#add-category").on("click", addCategoryHandler);

    start();
});



