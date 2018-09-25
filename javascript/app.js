$(document).ready(function () {

    var categories = [
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

    var favoriteGifs = [];

    function start() {
        var storedCategories = getCategoriesFromStorage();
        categories = storedCategories.length > 1 ? storedCategories  : categories;
        renderButtons();
        renderStoredFavGifs();
    }

    //Create elements
    function renderButtons() {
        categories.forEach(category => {
            createButton(category);
        });
    }

    function getCategoriesFromStorage(){
        var categories = JSON.parse(localStorage.getItem("categories") || "[]");
        return categories; 
    }
    
    function renderStoredFavGifs() {
        favoriteGifs = JSON.parse(localStorage.getItem("favoriteGifs") || "[]");
        favoriteGifs.forEach(gif => {
            appendGifComponent(gif, true);
        })
    }

    function appendGifComponent(gif, isFav = false) {
        const divToChange = !isFav ? "#gifComponents" : "#favoriteGifs";
        var gifComponents = $(divToChange);
        gifComponents.prepend(createGifComponent(gif, isFav));
    }

    function createGifComponent(gif, isFav) {
        const { rating, image, iconsDiv } = createGifComponentElements(gif, isFav);
        var divToReturn = $("<div>").addClass("gifComponent").attr("gifid", gif.id);
        isFav ? divToReturn.append(image, iconsDiv) :
            divToReturn.addClass("col-6 col-sm-4 col-md-3")
                .append(rating, image, iconsDiv);
        return divToReturn;
    }

    function createGifComponentElements(gif, isFav) {
        var rating = $('<p>').text(`Rating:${gif.rating}`);
        var image = createGifImgElement(gif);
        var iconsDiv = createIconsDiv(gif, isFav);
        return { rating, image, iconsDiv };
    }

    function createGifImgElement(gif) {
        return $('<img>')
            .attr("src", gif.stillUrl)
            .attr("alt", "gif")
            .attr("data-state", "still")
            .attr("data-still", gif.stillUrl)
            .attr("data-animate", gif.animateUrl)
            .on('click', gifClickHandler)
    }

    function createIconsDiv(gif, isFav) {
        var iconsDiv = $('<div>');
        var { favoriteIcon, downloadIcon, copyIcon } = createIconElements(isFav, gif);
        iconsDiv.append(favoriteIcon, downloadIcon, copyIcon);
        return iconsDiv;
    }

    function createIconElements(isFav, gif) {
        var favoriteIcon = $('<i>');
        !isFav ? favoriteIcon.addClass("icon far fa-heart") : favoriteIcon.addClass("icon far fa-window-close");
        !isFav ? favoriteIcon.on("click", favHandler) : favoriteIcon.on("click", removeFromFavHandler);
        addFavoriteIconAttributes(favoriteIcon, gif);
        var downloadIcon = $('<i>').addClass("icon fas fa-file-download")
            .on("click", iconDownloadHandler);
        addAnimateAttribute(downloadIcon, gif);
        var copyIcon = $('<i>').addClass("icon far fa-copy")
            .on("click", iconCopyHandler);
        addAnimateAttribute(copyIcon, gif);
        return { favoriteIcon, downloadIcon, copyIcon };
    }

    function addFavoriteIconAttributes(favoriteIcon, gif) {
        favoriteIcon.attr("rating", gif.rating)
        favoriteIcon.attr("stillUrl", gif.stillUrl)
        favoriteIcon.attr("animateUrl", gif.animateUrl)
        favoriteIcon.attr("gifid", gif.id)
    }

    function addAnimateAttribute(icon, gif) {
        icon.attr("animateUrl", gif.animateUrl)
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
            saveToLocalStorage('categories',categories);
            createButton(category);
            $("#category-input").val("");
        }
    };

    function iconDownloadHandler() {
        var gifUrl = $(this).attr("animateurl");
        $.ajax({
            url: gifUrl,
            method: 'GET',
            xhrFields: {
                responseType: 'blob'
            },
            success: function (data) {
                var a = document.createElement('a');
                var url = window.URL.createObjectURL(data);
                a.href = url;
                a.download = 'gif.gif';
                a.click();
                window.URL.revokeObjectURL(url);
            }
        });
    }

    function iconCopyHandler() {
        var value = $(this).attr("animateurl");
        var $temp = $("<input>");
          $("body").append($temp);
          $temp.val(value).select();
          document.execCommand("copy");
          $temp.remove();
    }

    function gifClickHandler() {
        var gif = $(this);
        var gifState = gif.attr("data-state");
        switchGifState(gifState, gif);
    }

    function favHandler() {
        const rating = $(this).attr("rating");
        const stillUrl = $(this).attr("stillUrl");
        const animateUrl = $(this).attr("animateUrl");
        const id = $(this).attr("gifId");
        const gif = { id, stillUrl, animateUrl, rating };
        favoriteGifs.push(gif);
        saveToLocalStorage('favoriteGifs', favoriteGifs);
        appendGifComponent(gif, true);
    }

    function removeFromFavHandler() {
        var gifId = $(this).attr("gifId");
        favoriteGifs = deleteFromArray(favoriteGifs, gifId);
        var elementToDelete = $(`#favoriteGifs div.gifComponent[gifid = "${gifId}"]`);
        elementToDelete.remove();
        saveToLocalStorage('favoriteGifs', favoriteGifs);
    }

    //Helpers
    function switchGifState(gifState, gif) {
        var attributeFilter = gifState === "still" ? "animate" : "still";
        var src = gif.attr(`data-${attributeFilter}`);
        gif.attr({ src });
        gif.attr("data-state", attributeFilter);
    }

    function saveToLocalStorage(key, element) {
        localStorage.setItem(key, JSON.stringify(element));
    }

    function deleteFromArray(array, id) {
        return array.filter(elem => {
            return elem.id !== id;
        });
    }

    //GiphyAPI
    function createGiphyUrl(category) {
        const giphyUrl = "https://api.giphy.com/v1/gifs/search?";
        const limit = $("#limitRequest").val();
        const key = "dc6zaTOxFJmzC";
        return `${giphyUrl}api_key=${key}&q=${category}&limit=${limit}`;
    }

    function giphyCall(queryUrl) {
        $.ajax({
            url: queryUrl,
            method: 'GET'
        }).then(giphyResponseHandler);
    }

    function giphyResponseHandler(gifs) {
        gifs.data.forEach(gif => {
            const gifObject = {
                id: gif.id,
                stillUrl: gif.images.fixed_height_still.url,
                animateUrl: gif.images.downsized.url,
                rating: gif.rating
            }
            appendGifComponent(gifObject);
        });
    }

    //Bindings
    $("#add-category").on("click", addCategoryHandler);

    start();
});



